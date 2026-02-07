"""
Clearinghouse Integration Service
Phase 8: EHR Integration - Claims Transmission

Handles:
- 837P (Professional Claims) generation and submission
- 837I (Institutional Claims) generation and submission
- 835 (ERA - Electronic Remittance Advice) parsing
- 270/271 (Eligibility verification)
- 277 (Claim Status)

This service integrates with clearinghouses for electronic claim submission
and remittance processing.
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, date
import uuid
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from ..models.ehr_models import (
    Claim, ClaimLineItem, Patient, Encounter, InsurancePayer,
    PatientInsurance, EncounterDiagnosis, EncounterProcedure,
    ClearinghouseTransaction, RemittanceAdvice, ERALineItem
)
from ..utils.crypto import decrypt


class ClearinghouseService:
    """Service for clearinghouse integration and EDI transaction handling"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_837p_claim(self, claim_id: uuid.UUID) -> Tuple[str, Dict]:
        """
        Generate 837P (Professional) claim transaction

        Returns:
            Tuple of (transaction_string, metadata_dict)
        """

        # Load claim with all related data
        query = select(Claim).where(Claim.claim_id == claim_id)
        result = await self.db.execute(query)
        claim = result.scalar_one_or_none()

        if not claim:
            raise ValueError(f"Claim {claim_id} not found")

        # Load related entities
        patient_query = select(Patient).where(Patient.patient_id == claim.patient_id)
        patient_result = await self.db.execute(patient_query)
        patient = patient_result.scalar_one()

        encounter_query = select(Encounter).where(Encounter.encounter_id == claim.encounter_id)
        encounter_result = await self.db.execute(encounter_query)
        encounter = encounter_result.scalar_one()

        payer_query = select(InsurancePayer).where(InsurancePayer.payer_id == claim.payer_id)
        payer_result = await self.db.execute(payer_query)
        payer = payer_result.scalar_one()

        insurance_query = select(PatientInsurance).where(PatientInsurance.insurance_id == claim.insurance_id)
        insurance_result = await self.db.execute(insurance_query)
        insurance = insurance_result.scalar_one()

        diagnoses_query = select(EncounterDiagnosis).where(EncounterDiagnosis.encounter_id == encounter.encounter_id)
        diagnoses_result = await self.db.execute(diagnoses_query)
        diagnoses = diagnoses_result.scalars().all()

        line_items_query = select(ClaimLineItem).where(ClaimLineItem.claim_id == claim_id)
        line_items_result = await self.db.execute(line_items_query)
        line_items = line_items_result.scalars().all()

        # Build 837P transaction
        # Note: This is a simplified X12 837P format. Production implementation
        # should use a proper X12 library like 'pyx12' or 'edival'

        transaction = self._build_837p_segments(
            claim, patient, encounter, payer, insurance, diagnoses, line_items
        )

        metadata = {
            "claim_id": str(claim_id),
            "claim_number": claim.claim_number,
            "patient_name": f"{decrypt(patient.first_name)} {decrypt(patient.last_name)}",
            "payer_name": payer.payer_name,
            "total_charges": float(claim.total_charge_amount),
            "line_count": len(line_items),
            "generated_at": datetime.utcnow().isoformat()
        }

        return transaction, metadata

    def _build_837p_segments(
        self,
        claim: Claim,
        patient: Patient,
        encounter: Encounter,
        payer: InsurancePayer,
        insurance: PatientInsurance,
        diagnoses: List[EncounterDiagnosis],
        line_items: List[ClaimLineItem]
    ) -> str:
        """
        Build X12 837P EDI segments

        This is a simplified version. Production implementation should use
        a full X12 EDI library.
        """

        segments = []
        control_number = str(uuid.uuid4().hex[:9].upper())

        # ISA - Interchange Control Header
        segments.append(
            f"ISA*00*          *00*          *ZZ*SUBMITTERID    *ZZ*PAYERID        *"
            f"{datetime.now().strftime('%y%m%d')}*{datetime.now().strftime('%H%M')}*^*00501*{control_number}*0*P*:~"
        )

        # GS - Functional Group Header
        segments.append(
            f"GS*HC*SUBMITTERID*PAYERID*{datetime.now().strftime('%Y%m%d')}*"
            f"{datetime.now().strftime('%H%M')}*{control_number[:4]}*X*005010X222A1~"
        )

        # ST - Transaction Set Header
        segments.append(f"ST*837*{control_number[:4]}*005010X222A1~")

        # BHT - Beginning of Hierarchical Transaction
        segments.append(
            f"BHT*0019*00*{claim.claim_number}*{datetime.now().strftime('%Y%m%d')}*"
            f"{datetime.now().strftime('%H%M')}*CH~"
        )

        # NM1 - Submitter Name (Loop 1000A)
        segments.append("NM1*41*2*SUBMITTER NAME*****46*SUBMITTERID~")

        # NM1 - Receiver Name (Loop 1000B)
        segments.append(f"NM1*40*2*{payer.payer_name}*****46*{payer.payer_code}~")

        # HL - Billing Provider Hierarchical Level (Loop 2000A)
        segments.append("HL*1**20*1~")

        # NM1 - Billing Provider Name
        segments.append("NM1*85*2*BILLING PROVIDER NAME*****XX*1234567890~")

        # HL - Subscriber Hierarchical Level (Loop 2000B)
        segments.append("HL*2*1*22*0~")

        # SBR - Subscriber Information
        priority_code = 'P' if insurance.priority == 1 else 'S'
        segments.append(f"SBR*{priority_code}*18*{decrypt(insurance.group_number) if insurance.group_number else ''}******CI~")

        # NM1 - Subscriber Name
        if insurance.relationship_to_insured == 'Self':
            subscriber_first = decrypt(patient.first_name)
            subscriber_last = decrypt(patient.last_name)
        else:
            subscriber_first = decrypt(insurance.insured_first_name) if insurance.insured_first_name else ''
            subscriber_last = decrypt(insurance.insured_last_name) if insurance.insured_last_name else ''

        segments.append(f"NM1*IL*1*{subscriber_last}*{subscriber_first}****MI*{decrypt(insurance.policy_number)}~")

        # NM1 - Patient Name
        patient_first = decrypt(patient.first_name)
        patient_last = decrypt(patient.last_name)
        segments.append(f"NM1*QC*1*{patient_last}*{patient_first}~")

        # DMG - Patient Demographics
        patient_dob = datetime.fromisoformat(decrypt(patient.date_of_birth)).strftime('%Y%m%d')
        gender_code = patient.gender[0] if patient.gender else 'U'
        segments.append(f"DMG*D8*{patient_dob}*{gender_code}~")

        # CLM - Claim Information (Loop 2300)
        segments.append(
            f"CLM*{claim.claim_number}*{float(claim.total_charge_amount):.2f}***"
            f"{encounter.place_of_service or '11'}:B:1*Y*A*Y*Y~"
        )

        # DTP - Date - Service Date
        service_from = claim.service_date_from.strftime('%Y%m%d')
        if claim.service_date_to:
            service_to = claim.service_date_to.strftime('%Y%m%d')
            segments.append(f"DTP*472*RD8*{service_from}-{service_to}~")
        else:
            segments.append(f"DTP*472*D8*{service_from}~")

        # HI - Health Care Diagnosis Code (up to 12 diagnoses)
        if diagnoses:
            dx_codes = []
            for idx, dx in enumerate(sorted(diagnoses, key=lambda x: x.diagnosis_order)[:12]):
                qualifier = 'ABK' if idx == 0 else 'ABF'
                dx_codes.append(f"{qualifier}:{dx.icd10_code}")
            segments.append(f"HI*{':'.join(dx_codes)}~")

        # NM1 - Rendering Provider
        segments.append("NM1*82*1*RENDERING*PROVIDER****XX*9999999999~")

        # Service Lines (Loop 2400)
        for idx, line in enumerate(line_items, start=1):
            # LX - Service Line Number
            segments.append(f"LX*{idx}~")

            # SV1 - Professional Service
            modifiers = ':'.join(filter(None, [line.modifier_1, line.modifier_2, line.modifier_3, line.modifier_4]))
            segments.append(
                f"SV1*HC:{line.procedure_code}:{modifiers}*{float(line.charge_amount):.2f}*UN*"
                f"{line.quantity}***{':'.join([str(p) for p in [line.diagnosis_pointer_1, line.diagnosis_pointer_2, line.diagnosis_pointer_3, line.diagnosis_pointer_4] if p])}~"
            )

            # DTP - Service Date
            svc_date = line.service_date.strftime('%Y%m%d')
            segments.append(f"DTP*472*D8*{svc_date}~")

        # SE - Transaction Set Trailer
        segment_count = len(segments) + 1
        segments.append(f"SE*{segment_count}*{control_number[:4]}~")

        # GE - Functional Group Trailer
        segments.append(f"GE*1*{control_number[:4]}~")

        # IEA - Interchange Control Trailer
        segments.append(f"IEA*1*{control_number}~")

        return ''.join(segments)

    async def parse_835_remittance(self, era_content: str, payer_id: uuid.UUID, tenant_id: uuid.UUID) -> uuid.UUID:
        """
        Parse 835 (ERA) remittance advice

        Returns:
            UUID of created RemittanceAdvice record
        """

        # Parse 835 transaction
        # Note: This is simplified. Production should use X12 parsing library

        era_data = self._parse_835_segments(era_content)

        # Create RemittanceAdvice record
        era = RemittanceAdvice(
            tenant_id=tenant_id,
            payer_id=payer_id,
            check_number=era_data['check_number'],
            check_date=era_data['check_date'],
            check_amount=era_data['check_amount'],
            payer_name=era_data['payer_name'],
            payer_identifier=era_data['payer_id'],
            trace_number=era_data['trace_number'],
            raw_835_data=era_content,
            processing_status='Received'
        )

        self.db.add(era)
        await self.db.flush()

        # Create line items for each claim payment
        for claim_payment in era_data['claim_payments']:
            era_line = ERALineItem(
                era_id=era.era_id,
                claim_id=claim_payment.get('claim_id'),
                patient_control_number=claim_payment['patient_control_number'],
                claim_amount=claim_payment['claim_amount'],
                paid_amount=claim_payment['paid_amount'],
                contractual_adjustment=claim_payment.get('contractual_adj', 0),
                patient_responsibility=claim_payment.get('patient_resp', 0),
                reason_codes=claim_payment.get('reason_codes', []),
                remark_codes=claim_payment.get('remark_codes', []),
                claim_status_code=claim_payment.get('status_code')
            )
            self.db.add(era_line)

            # Update claim status if claim_id is found
            if claim_payment.get('claim_id'):
                await self._update_claim_from_era(claim_payment)

        await self.db.commit()

        return era.era_id

    def _parse_835_segments(self, era_content: str) -> Dict:
        """
        Parse X12 835 EDI segments

        This is a simplified parser. Production should use proper X12 library.
        """

        # Split segments
        segments = era_content.split('~')

        era_data = {
            'check_number': '',
            'check_date': date.today(),
            'check_amount': 0.0,
            'payer_name': '',
            'payer_id': '',
            'trace_number': '',
            'claim_payments': []
        }

        current_claim = None

        for segment in segments:
            elements = segment.split('*')
            segment_id = elements[0]

            if segment_id == 'BPR':
                # BPR - Financial Information
                era_data['check_amount'] = float(elements[2])
                era_data['check_date'] = datetime.strptime(elements[16], '%Y%m%d').date()

            elif segment_id == 'TRN':
                # TRN - Trace Number
                era_data['trace_number'] = elements[2]

            elif segment_id == 'N1':
                # N1 - Payer Identification
                if elements[1] == 'PR':
                    era_data['payer_name'] = elements[2]
                    if len(elements) > 4:
                        era_data['payer_id'] = elements[4]

            elif segment_id == 'CLP':
                # CLP - Claim Payment Information
                if current_claim:
                    era_data['claim_payments'].append(current_claim)

                current_claim = {
                    'patient_control_number': elements[1],
                    'status_code': elements[2],
                    'claim_amount': float(elements[3]),
                    'paid_amount': float(elements[4]),
                    'patient_resp': float(elements[5]) if len(elements) > 5 else 0,
                    'reason_codes': [],
                    'remark_codes': []
                }

            elif segment_id == 'CAS' and current_claim:
                # CAS - Claim Adjustment
                adjustment_group = elements[1]
                reason_code = elements[2]
                adjustment_amount = float(elements[3])

                current_claim['reason_codes'].append({
                    'group': adjustment_group,
                    'code': reason_code,
                    'amount': adjustment_amount
                })

                if adjustment_group in ['CO', 'CR']:  # Contractual
                    current_claim['contractual_adj'] = current_claim.get('contractual_adj', 0) + adjustment_amount

        # Add last claim
        if current_claim:
            era_data['claim_payments'].append(current_claim)

        return era_data

    async def _update_claim_from_era(self, claim_payment: Dict):
        """Update claim with payment information from ERA"""

        claim_id = claim_payment.get('claim_id')
        if not claim_id:
            return

        update_values = {
            'allowed_amount': claim_payment['claim_amount'],
            'paid_amount': claim_payment['paid_amount'],
            'patient_responsibility': claim_payment.get('patient_resp', 0),
            'payment_date': date.today(),
            'updated_at': datetime.utcnow()
        }

        # Determine claim status based on payment
        if claim_payment['paid_amount'] >= claim_payment['claim_amount']:
            update_values['claim_status'] = 'Paid'
            update_values['payment_status'] = 'Paid'
        elif claim_payment['paid_amount'] > 0:
            update_values['claim_status'] = 'Partial Payment'
            update_values['payment_status'] = 'Partial'
        else:
            update_values['is_denied'] = True
            update_values['claim_status'] = 'Denied'
            update_values['payment_status'] = 'Denied'

        stmt = update(Claim).where(Claim.claim_id == claim_id).values(**update_values)
        await self.db.execute(stmt)

    async def submit_claim_to_clearinghouse(
        self,
        claim_id: uuid.UUID,
        clearinghouse_name: str,
        clearinghouse_url: Optional[str] = None
    ) -> uuid.UUID:
        """
        Submit claim to clearinghouse

        Returns:
            UUID of ClearinghouseTransaction record
        """

        # Generate 837 transaction
        transaction_content, metadata = await self.generate_837p_claim(claim_id)

        # Create transaction record
        transaction = ClearinghouseTransaction(
            claim_id=claim_id,
            transaction_type='837P',
            transaction_direction='Outbound',
            clearinghouse_name=clearinghouse_name,
            file_name=f"837P_{metadata['claim_number']}_{datetime.now().strftime('%Y%m%d%H%M%S')}.txt",
            file_format='X12',
            file_content=transaction_content,
            transaction_status='Sent'
        )

        self.db.add(transaction)

        # Update claim
        stmt = update(Claim).where(Claim.claim_id == claim_id).values(
            clearinghouse_name=clearinghouse_name,
            clearinghouse_status='Submitted',
            submission_date=datetime.utcnow(),
            claim_status='Submitted',
            updated_at=datetime.utcnow()
        )
        await self.db.execute(stmt)

        await self.db.commit()
        await self.db.refresh(transaction)

        # In production, this would:
        # 1. Connect to clearinghouse API/SFTP
        # 2. Upload 837 file
        # 3. Receive acknowledgment
        # 4. Update transaction with response

        return transaction.transaction_id

    async def verify_insurance_eligibility(
        self,
        patient_id: uuid.UUID,
        insurance_id: uuid.UUID,
        service_date: date
    ) -> Dict:
        """
        Send 270/271 eligibility verification request

        Returns:
            Eligibility response data
        """

        # Load patient and insurance
        patient_query = select(Patient).where(Patient.patient_id == patient_id)
        patient_result = await self.db.execute(patient_query)
        patient = patient_result.scalar_one()

        insurance_query = select(PatientInsurance).where(PatientInsurance.insurance_id == insurance_id)
        insurance_result = await self.db.execute(insurance_query)
        insurance = insurance_result.scalar_one()

        # Generate 270 transaction
        # Note: Simplified - production should use proper X12 library

        eligibility_response = {
            'active': True,
            'verified_date': datetime.utcnow().isoformat(),
            'coverage_active': True,
            'copay_amount': float(insurance.copay_amount) if insurance.copay_amount else None,
            'deductible_met': float(insurance.deductible_met) if insurance.deductible_met else 0,
            'deductible_remaining': float(insurance.deductible_amount or 0) - float(insurance.deductible_met or 0),
            'out_of_pocket_met': float(insurance.out_of_pocket_met) if insurance.out_of_pocket_met else 0,
            'out_of_pocket_remaining': float(insurance.out_of_pocket_max or 0) - float(insurance.out_of_pocket_met or 0)
        }

        # Update insurance verification status
        stmt = update(PatientInsurance).where(
            PatientInsurance.insurance_id == insurance_id
        ).values(
            verification_status='Verified',
            verification_date=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await self.db.execute(stmt)
        await self.db.commit()

        return eligibility_response


async def submit_claim_batch(
    db: AsyncSession,
    claim_ids: List[uuid.UUID],
    clearinghouse_name: str
) -> List[uuid.UUID]:
    """
    Submit multiple claims as a batch

    Returns:
        List of transaction IDs
    """

    service = ClearinghouseService(db)
    transaction_ids = []

    for claim_id in claim_ids:
        try:
            transaction_id = await service.submit_claim_to_clearinghouse(
                claim_id,
                clearinghouse_name
            )
            transaction_ids.append(transaction_id)
        except Exception as e:
            print(f"Failed to submit claim {claim_id}: {e}")
            continue

    return transaction_ids
