"""
Fix Phase 8 Migration - Add DROP TRIGGER IF EXISTS before all CREATE TRIGGER statements
"""

import re
from pathlib import Path

migration_file = Path(__file__).parent / 'migrations' / '006_phase8_ehr_claims_integration.sql'

print(f"Reading {migration_file}...")
with open(migration_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to match CREATE TRIGGER statements and extract the trigger name and table name
# Format: CREATE TRIGGER trg_name
#             BEFORE/AFTER UPDATE/INSERT ON table_name
trigger_pattern = r'CREATE TRIGGER (trg_\w+)\s+(?:BEFORE|AFTER)\s+(?:UPDATE|INSERT)\s+ON\s+(\w+)'

def add_drop_trigger(match):
    trigger_name = match.group(1)
    table_name = match.group(2)
    original = match.group(0)
    return f'DROP TRIGGER IF EXISTS {trigger_name} ON {table_name};\n{original}'

# Replace all CREATE TRIGGER statements
new_content = re.sub(trigger_pattern, add_drop_trigger, content)

# Count replacements
count = len(re.findall(trigger_pattern, content))
print(f"Found {count} CREATE TRIGGER statements")

# Write back
print(f"Writing updated content to {migration_file}...")
with open(migration_file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"✓ Successfully added DROP TRIGGER IF EXISTS for {count} triggers")
