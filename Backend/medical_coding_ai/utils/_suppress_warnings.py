import warnings
import os
import sys

# Add this file's directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Suppress common warnings
warnings.filterwarnings("ignore", message=".*'__path__._path'.*")
warnings.filterwarnings("ignore", message=".*name 'GpuIndexIVFFlat' is not defined.*")
warnings.filterwarnings("ignore", message=".*Tried to instantiate class.*")

# This file intentionally doesn't import any modules
# to avoid circular imports

# It's meant to be imported at the top of __init__.py files
