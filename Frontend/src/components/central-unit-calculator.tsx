import { useState } from 'react';
import { 
  Calculator, 
  Plus, 
  Minus, 
  Save, 
  RefreshCw, 
  Eye, 
  FileText, 
  DollarSign,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react';

interface UnitCalculation {
  id: string;
  cptCode: string;
  description: string;
  units: number;
  unitValue: number;
  totalValue: number;
  modifier?: string;
  billingUnits?: number;
  timeSpent?: number;
  conversionFactor?: number;
}

interface CalculationSession {
  id: string;
  patientName: string;
  dateOfService: string;
  calculations: UnitCalculation[];
  totalUnits: number;
  totalValue: number;
  sessionNotes?: string;
}

export function CentralUnitCalculator({ onClose }: { onClose?: () => void }) {
  const [currentSession, setCurrentSession] = useState<CalculationSession>({
    id: 'session1',
    patientName: 'John Smith',
    dateOfService: '2024-01-15',
    calculations: [],
    totalUnits: 0,
    totalValue: 0
  });

  const [selectedCPT, setSelectedCPT] = useState('');
  const [units, setUnits] = useState(1);
  const [showPresets, setShowPresets] = useState(false);

  const commonCPTs = [
    { code: '99213', description: 'Office visit, established patient, low complexity', baseUnits: 1.3, unitValue: 75.50 },
    { code: '99214', description: 'Office visit, established patient, moderate complexity', baseUnits: 2.1, unitValue: 110.25 },
    { code: '99215', description: 'Office visit, established patient, high complexity', baseUnits: 3.2, unitValue: 165.80 },
    { code: '36415', description: 'Venipuncture', baseUnits: 0.5, unitValue: 8.50 },
    { code: '93306', description: 'Echocardiogram', baseUnits: 4.5, unitValue: 485.00 },
    { code: '70553', description: 'MRI Brain with contrast', baseUnits: 8.2, unitValue: 1250.00 },
    { code: '45378', description: 'Colonoscopy, diagnostic', baseUnits: 6.8, unitValue: 650.00 }
  ];

  const unitPresets = [
    { name: 'Standard Visit', units: 1 },
    { name: 'Extended Time', units: 1.5 },
    { name: 'Complex Case', units: 2 },
    { name: 'Multiple Issues', units: 2.5 }
  ];

  const addCalculation = () => {
    if (!selectedCPT) return;

    const cptData = commonCPTs.find(cpt => cpt.code === selectedCPT);
    if (!cptData) return;

    const calculation: UnitCalculation = {
      id: `calc_${Date.now()}`,
      cptCode: selectedCPT,
      description: cptData.description,
      units: units,
      unitValue: cptData.unitValue,
      totalValue: units * cptData.unitValue,
      conversionFactor: 36.09 // 2024 Medicare conversion factor
    };

    const updatedCalculations = [...currentSession.calculations, calculation];
    const totalUnits = updatedCalculations.reduce((sum, calc) => sum + calc.units, 0);
    const totalValue = updatedCalculations.reduce((sum, calc) => sum + calc.totalValue, 0);

    setCurrentSession({
      ...currentSession,
      calculations: updatedCalculations,
      totalUnits,
      totalValue
    });

    // Reset form
    setSelectedCPT('');
    setUnits(1);
  };

  const removeCalculation = (calcId: string) => {
    const updatedCalculations = currentSession.calculations.filter(calc => calc.id !== calcId);
    const totalUnits = updatedCalculations.reduce((sum, calc) => sum + calc.units, 0);
    const totalValue = updatedCalculations.reduce((sum, calc) => sum + calc.totalValue, 0);

    setCurrentSession({
      ...currentSession,
      calculations: updatedCalculations,
      totalUnits,
      totalValue
    });
  };

  const updateCalculationUnits = (calcId: string, newUnits: number) => {
    const updatedCalculations = currentSession.calculations.map(calc => {
      if (calc.id === calcId) {
        return {
          ...calc,
          units: newUnits,
          totalValue: newUnits * calc.unitValue
        };
      }
      return calc;
    });

    const totalUnits = updatedCalculations.reduce((sum, calc) => sum + calc.units, 0);
    const totalValue = updatedCalculations.reduce((sum, calc) => sum + calc.totalValue, 0);

    setCurrentSession({
      ...currentSession,
      calculations: updatedCalculations,
      totalUnits,
      totalValue
    });
  };

  const saveSession = () => {
    console.log('Saving calculation session:', currentSession);
  };

  const clearSession = () => {
    setCurrentSession({
      ...currentSession,
      calculations: [],
      totalUnits: 0,
      totalValue: 0
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#62d5e4] rounded-lg flex items-center justify-center">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Central Unit Calculator</h2>
            <p className="text-sm text-gray-600">Calculate billing units and values</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={clearSession}
            className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={saveSession}
            className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Save className="w-4 h-4" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Session Info */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Patient</span>
          </div>
          <p className="text-sm text-gray-700">{currentSession.patientName}</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Date of Service</span>
          </div>
          <p className="text-sm text-gray-700">{currentSession.dateOfService}</p>
        </div>
        
        <div className="bg-[#62d5e4]/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-[#62d5e4]" />
            <span className="text-sm font-medium text-gray-900">Total Value</span>
          </div>
          <p className="text-lg font-semibold text-[#62d5e4]">${currentSession.totalValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Add New Calculation */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Add New Calculation</h3>
        <div className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">CPT Code</label>
            <select 
              value={selectedCPT}
              onChange={(e) => setSelectedCPT(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4]"
            >
              <option value="">Select CPT Code...</option>
              {commonCPTs.map((cpt) => (
                <option key={cpt.code} value={cpt.code}>
                  {cpt.code} - {cpt.description}
                </option>
              ))}
            </select>
          </div>
          
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
            <input 
              type="number" 
              step="0.1"
              min="0.1"
              value={units}
              onChange={(e) => setUnits(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#62d5e4]"
            />
          </div>
          
          <div className="col-span-3">
            <button 
              onClick={() => setShowPresets(!showPresets)}
              className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Unit Presets
            </button>
            {showPresets && (
              <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                {unitPresets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setUnits(preset.units);
                      setShowPresets(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {preset.name} ({preset.units}x)
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="col-span-2">
            <button 
              onClick={addCalculation}
              disabled={!selectedCPT}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#62d5e4] text-white rounded-lg hover:bg-[#4bc5d6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Calculations Table */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Current Calculations</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">CPT Code</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Units</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Unit Value</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Total</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentSession.calculations.length > 0 ? (
                currentSession.calculations.map((calc) => (
                  <tr key={calc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm text-gray-900">{calc.cptCode}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">{calc.description}</td>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={calc.units}
                        onChange={(e) => updateCalculationUnits(calc.id, parseFloat(e.target.value) || 1)}
                        className="w-16 px-2 py-1 text-sm text-center border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-[#62d5e4]"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">${calc.unitValue.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-green-600">${calc.totalValue.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => removeCalculation(calc.id)}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    <Calculator className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No calculations added yet</p>
                    <p className="text-sm">Select a CPT code above to get started</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {currentSession.calculations.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Total Units</span>
              </div>
              <p className="text-2xl font-semibold text-blue-600">{currentSession.totalUnits.toFixed(1)}</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Total Value</span>
              </div>
              <p className="text-2xl font-semibold text-green-600">${currentSession.totalValue.toFixed(2)}</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">Avg Unit Value</span>
              </div>
              <p className="text-2xl font-semibold text-purple-600">
                ${currentSession.totalUnits > 0 ? (currentSession.totalValue / currentSession.totalUnits).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <AlertCircle className="w-4 h-4" />
            <span>Calculations based on 2024 Medicare fee schedule (CF: $36.09)</span>
          </div>
        </div>
      )}
    </div>
  );
}