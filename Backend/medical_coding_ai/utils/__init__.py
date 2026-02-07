# Utils package initialization
try:
    from ._suppress_warnings import *
except ImportError:
    # If the warning suppressor isn't available, just continue
    pass

