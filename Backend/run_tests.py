#!/usr/bin/env python3
"""
Test Runner Script for Panaceon V-06
Provides convenient test execution with various options
"""

import sys
import subprocess
import argparse
from pathlib import Path


def run_command(cmd, description):
    """Run a command and handle output."""
    print(f"\n{'=' * 80}")
    print(f"Running: {description}")
    print(f"Command: {' '.join(cmd)}")
    print(f"{'=' * 80}\n")

    result = subprocess.run(cmd, cwd=Path(__file__).parent)
    return result.returncode == 0


def main():
    parser = argparse.ArgumentParser(
        description="Run Panaceon V-06 authentication tests",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_tests.py --all              # Run all tests
  python run_tests.py --auth             # Run authentication tests only
  python run_tests.py --security         # Run security tests only
  python run_tests.py --integration      # Run integration tests only
  python run_tests.py --coverage         # Run with coverage report
  python run_tests.py --quick            # Run without verbose output
  python run_tests.py --parallel         # Run tests in parallel
        """
    )

    parser.add_argument('--all', action='store_true', help='Run all tests (default)')
    parser.add_argument('--auth', action='store_true', help='Run authentication tests only')
    parser.add_argument('--security', action='store_true', help='Run security tests only')
    parser.add_argument('--integration', action='store_true', help='Run integration tests only')
    parser.add_argument('--coverage', action='store_true', help='Run with coverage report')
    parser.add_argument('--html-coverage', action='store_true', help='Generate HTML coverage report')
    parser.add_argument('--quick', action='store_true', help='Run without verbose output')
    parser.add_argument('--parallel', action='store_true', help='Run tests in parallel')
    parser.add_argument('--markers', type=str, help='Run tests with specific marker (e.g., "asyncio")')

    args = parser.parse_args()

    # Build pytest command
    cmd = ['pytest']

    # Add verbosity unless quick mode
    if not args.quick:
        cmd.append('-v')

    # Add parallel execution
    if args.parallel:
        try:
            import pytest_xdist
            cmd.extend(['-n', 'auto'])
            print("Running tests in parallel...")
        except ImportError:
            print("Warning: pytest-xdist not installed. Install with: pip install pytest-xdist")
            print("Running tests sequentially...")

    # Add coverage options
    if args.coverage or args.html_coverage:
        cmd.extend(['--cov=medical_coding_ai', '--cov-report=term-missing'])

        if args.html_coverage:
            cmd.append('--cov-report=html')
            print("HTML coverage report will be generated in htmlcov/")

    # Add marker filter
    if args.markers:
        cmd.extend(['-m', args.markers])

    # Add specific test files
    if args.auth:
        cmd.append('tests/test_authentication.py')
        description = "Authentication Tests"
    elif args.security:
        cmd.append('tests/test_security.py')
        description = "Security Tests"
    elif args.integration:
        cmd.append('tests/test_integration.py')
        description = "Integration Tests"
    else:
        cmd.append('tests/')
        description = "All Tests (Phases 1-3)"

    # Run tests
    success = run_command(cmd, description)

    # Print summary
    print(f"\n{'=' * 80}")
    if success:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed. Review output above.")
    print(f"{'=' * 80}\n")

    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
