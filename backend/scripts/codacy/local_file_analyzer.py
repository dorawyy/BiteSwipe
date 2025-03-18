#!/usr/bin/env python3
"""
ESLint Local File Analyzer - A tool to run ESLint analysis on a specific file using Docker

This script:
1. Builds a Docker image based on Codacy's base image for ESLint analysis
2. Runs the Docker image on a specified file
3. Uses the ESLint settings from the repository root (.eslintrc.json)
4. Outputs results to a file in the scripts folder
"""

import os
import sys
import json
import argparse
import subprocess
import datetime
import platform
from pathlib import Path
from typing import Dict, List, Any, Optional

# ANSI color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Run Codacy analysis on files using Docker')
    # Remove positional argument and replace with optional argument with -f shorthand
    parser.add_argument('--file', '-f', dest='file_path', help='Path to the file to analyze (relative to repository root or absolute)')
    parser.add_argument('--output-dir', help='Directory to save results (default: script directory)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose output')
    parser.add_argument('--no-cache', action='store_true', help='Disable the cache volume for lint rules')
    parser.add_argument('--all', '-a', action='store_true', help='Analyze all relevant files in the repository')
    return parser.parse_args()

def find_repo_root(start_path: str = None) -> Optional[str]:
    """
    Find the repository root based on script location
    This assumes the script is in a 'scripts/codacy' directory within the repository
    If that fails, it will attempt to find the repo by looking for a .git directory
    """
    # First try to determine repo root based on script location
    script_path = os.path.dirname(os.path.abspath(__file__))
    # Script is in scripts/codacy, so repo root is two levels up
    potential_repo_root = os.path.abspath(os.path.join(script_path, "../../.."))
    
    # Verify this looks like our repo root
    if os.path.isdir(potential_repo_root) and os.path.exists(os.path.join(potential_repo_root, "backend/src")):
        return potential_repo_root
    
    # Fall back to original method if the above doesn't work
    if not start_path:
        start_path = os.getcwd()
    
    path = Path(start_path).absolute()
    
    while path != path.parent:
        if (path / '.git').exists():
            return str(path)
        path = path.parent
    
    return None

def resolve_file_path(file_path: str) -> str:
    """
    Convert any file path to an absolute path
    - If already absolute, returns as is
    - If relative, tries to resolve against current working directory first,
      and falls back to repo root if not found
    """
    # If already absolute, just return it
    if os.path.isabs(file_path):
        return file_path
        
    # Try to resolve against the current working directory
    cwd = os.getcwd()
    abs_path_cwd = os.path.abspath(os.path.join(cwd, file_path))
    if os.path.exists(abs_path_cwd):
        return abs_path_cwd
        
    return abs_path_cwd  # Return the absolute path even if not found

def check_docker_image(verbose: bool = False) -> bool:
    """Check if the official Codacy ESLint Docker image is available"""
    # Use the official Codacy ESLint image
    image_name = "codacy/codacy-eslint:latest"
    docker_cmd = ["docker", "image", "ls", image_name, "--format", "{{.Repository}}"]
    
    if verbose:
        print(f"{Colors.YELLOW}Checking for ESLint Docker image with command: {' '.join(docker_cmd)}{Colors.END}")
    
    try:
        result = subprocess.run(
            docker_cmd,
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # If the image is found, the command will return the repository name
        if result.stdout.strip():
            if verbose:
                print(f"{Colors.GREEN}ESLint Docker image found.{Colors.END}")
            return True
        
        # If the image is not found, inform the user
        print(f"{Colors.RED}Codacy ESLint Docker image not found locally. Please pull it with:{Colors.END}")
        print(f"{Colors.YELLOW}docker pull codacy/codacy-eslint:latest{Colors.END}")
        return False
    except Exception as e:
        print(f"{Colors.RED}Error checking Docker image: {str(e)}{Colors.END}")
        return False

def run_eslint_docker(file_path: str, repo_root: str, verbose: bool = False, use_cache: bool = True, analyze_all: bool = False) -> Dict:
    """Run ESLint Docker image on the specified file"""
    # Handle analyze_all case
    if analyze_all:
        print(f"{Colors.BLUE}Running ESLint analysis on all relevant files in the repository{Colors.END}")
    else:
        # file_path should already be absolute at this point
        assert os.path.isabs(file_path), f"Expected absolute path, got: {file_path}"
        
        # Get relative path from repo root for Docker volume mapping
        rel_path = os.path.relpath(file_path, repo_root)
        
        print(f"{Colors.BLUE}Running ESLint analysis on: {Colors.BOLD}{file_path}{Colors.END}")
        print(f"{Colors.BLUE}Relative path in repository: {Colors.BOLD}{rel_path}{Colors.END}")
    
    # Create cache directory if it doesn't exist
    cache_dir = os.path.join(repo_root, "backend", "scripts", "codacy", ".cache")
    os.makedirs(cache_dir, exist_ok=True)
    
    # Prepare Docker command
    docker_cmd = [
        "docker", "run",
        "--rm",
    ]
    
    # Add platform flag if running on Apple Silicon to avoid platform warning
    if platform.system() == "Darwin" and platform.machine() == "arm64":
        docker_cmd.extend(["--platform", "linux/amd64"])
        if verbose:
            print(f"{Colors.BLUE}Detected Apple Silicon, using platform flag{Colors.END}")
    
    # Add volume mappings
    docker_cmd.extend([
        "-v", f"{repo_root}:/src",
    ])
    
    # Add cache volume if enabled
    if use_cache:
        docker_cmd.extend([
            "-v", f"{cache_dir}:/tmp/.eslint-cache",
        ])
        if verbose:
            print(f"{Colors.BLUE}Using cache directory: {Colors.BOLD}{cache_dir}{Colors.END}")
    
    # Add .eslintrc.json mapping if it exists
    if os.path.exists(f"{repo_root}/.eslintrc.json"):
        docker_cmd.extend(["-v", f"{repo_root}/.eslintrc.json:/src/.eslintrc.json"])
    
    # Add working directory option to Docker
    docker_cmd.extend([
        "-w", "/src",  # Set working directory to /src
    ])
    
    # Add image name and ESLint command
    docker_cmd.extend([
        "codacy/codacy-eslint:latest",  # Use the official Codacy ESLint image
        "npx", "eslint",  # Run ESLint directly
        "--format", "json",  # Output in JSON format for easier parsing
    ])
    
    if analyze_all:
        # For analyzing all files, specify the directory pattern
        if verbose:
            print(f"{Colors.BLUE}Will analyze all JavaScript and TypeScript files{Colors.END}")
        # Add the pattern to analyze all JS/TS files
        docker_cmd.extend([
            "--ext", ".js,.jsx,.ts,.tsx", "/src/backend"  # Analyze all JS/TS files in backend directory
        ])
    else:
        # Determine the file extension to select appropriate tools
        file_ext = os.path.splitext(file_path)[1].lower().lstrip('.')
        
        # Currently we only support JavaScript/TypeScript files with ESLint
        if file_ext not in ['js', 'jsx', 'ts', 'tsx']:
            print(f"{Colors.RED}Warning: File extension '{file_ext}' is not supported by this analyzer.{Colors.END}")
            print(f"{Colors.RED}Currently only JavaScript and TypeScript files are supported.{Colors.END}")
            return {
                "error": f"Unsupported file extension: {file_ext}",
                "supported_extensions": ["js", "jsx", "ts", "tsx"]
            }
        
        # We'll analyze the specific file directly with ESLint
        if verbose:
            print(f"{Colors.BLUE}Will analyze file: {Colors.BOLD}{rel_path}{Colors.END}")
        
        # Add the file path to analyze
        docker_cmd.append(f"/src/{rel_path}")
    
    if verbose:
        print(f"{Colors.YELLOW}Running command: {' '.join(docker_cmd)}{Colors.END}")
    
    try:
        # Run Docker command
        result = subprocess.run(
            docker_cmd,
            check=False,  # Don't raise exception on non-zero exit
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # ESLint returns exit code 1 when it finds linting errors, which is normal
        # Only treat it as an error if the exit code is not 0 or 1
        if result.returncode != 0 and result.returncode != 1:
            print(f"{Colors.RED}Error running ESLint Docker: Exit code {result.returncode}{Colors.END}")
            if result.stderr:
                print(f"{Colors.RED}Error output:{Colors.END}\n{result.stderr}")
            if result.stdout:
                print(f"{Colors.YELLOW}Standard output (first 500 chars):{Colors.END}\n{result.stdout[:500]}..." if len(result.stdout) > 500 else result.stdout)
            
            return {
                "error": f"Docker command failed with exit code {result.returncode}",
                "stderr": result.stderr,
                "stdout": result.stdout,
                "command": " ".join(docker_cmd)
            }
        
        # Parse JSON output
        try:
            # Check if the output is empty or just contains npm notices
            if not result.stdout.strip() or all(line.startswith('npm notice') for line in result.stdout.strip().split('\n') if line.strip()):
                return {
                    "success": True,
                    "results": [],
                    "file_analyzed": rel_path if not analyze_all else "all_files",
                    "verbose": verbose
                }
            
            # Parse the JSON output from ESLint
            # Filter out npm notices from the output
            clean_stdout = '\n'.join([line for line in result.stdout.splitlines() 
                                    if not line.strip().startswith('npm notice')])
            
            # Parse the JSON output
            eslint_results = json.loads(clean_stdout)
            
            # Process the ESLint results
            output = []
            for file_result in eslint_results:
                file_path = file_result.get('filePath', '').replace('/src/', '')
                
                # Process each message (issue) in the file
                for message in file_result.get('messages', []):
                    severity_level = message.get('severity', 0)
                    severity = 'error' if severity_level == 2 else 'warning' if severity_level == 1 else 'info'
                    
                    issue = {
                        'filename': file_path,
                        'line': message.get('line', 0),
                        'column': message.get('column', 0),
                        'severity': severity,
                        'message': message.get('message', ''),
                        'rule': message.get('ruleId', '')
                    }
                    output.append(issue)
            
            # Filter results to only include those for the specific file we're analyzing (if not analyze_all)
            filtered_output = []
            if analyze_all:
                # When analyzing all files, include all results
                filtered_output = output if isinstance(output, list) else [output]
                if verbose:
                    print(f"{Colors.GREEN}Found {len(filtered_output)} issues across all files{Colors.END}")
            else:
                # When analyzing a specific file, filter results
                if isinstance(output, list):
                    for item in output:
                        filename = item.get('filename', '')
                        # Match either the relative path or just the filename
                        if rel_path in filename or os.path.basename(file_path) == os.path.basename(filename):
                            filtered_output.append(item)
                else:
                    filtered_output = output
                    
                if verbose:
                    print(f"{Colors.GREEN}Found {len(filtered_output)} issues for file {os.path.basename(file_path)}{Colors.END}")
                
            return {
                "success": True,
                "results": filtered_output,
                "file_analyzed": rel_path if not analyze_all else "all_files",
                "verbose": verbose
            }
        except json.JSONDecodeError:
            print(f"{Colors.RED}Error parsing JSON output:{Colors.END}")
            print(result.stdout)
            return {
                "error": "Failed to parse JSON output",
                "stdout": result.stdout,
                "stderr": result.stderr
            }
            
    except Exception as e:
        print(f"{Colors.RED}Error: {str(e)}{Colors.END}")
        return {
            "error": str(e),
            "command": " ".join(docker_cmd),
            "verbose": verbose
        }

def save_results(results: Dict, file_path: str = None, output_dir: str = None) -> str:
    """Save analysis results to a file"""
    if not output_dir:
        # Use script directory as default output location
        output_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate filename based on analyzed file and timestamp
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if file_path:
        # Single file analysis
        file_name = os.path.basename(file_path)
        output_file = os.path.join(output_dir, f"eslint_analysis_{file_name}_{timestamp}.json")
    else:
        # Full repository analysis
        output_file = os.path.join(output_dir, f"eslint_analysis_full_{timestamp}.json")
    
    # Save results to file
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    # No temporary directory to clean up in this version
    
    return output_file

def print_summary(results: Dict):
    """Print a summary of the analysis results"""
    if "error" in results:
        print(f"{Colors.RED}Analysis failed: {results['error']}{Colors.END}")
        return
    
    if "results" not in results or not results["results"]:
        print(f"{Colors.GREEN}No issues found!{Colors.END}")
        return
    
    issues = results["results"]
    if isinstance(issues, list):
        issue_count = len(issues)
        print(f"\n{Colors.BOLD}Analysis Summary:{Colors.END}")
        print(f"Found {issue_count} issue{'s' if issue_count != 1 else ''} in {results['file_analyzed']}")
        
        # Group issues by severity
        severities = {}
        for issue in issues:
            severity = issue.get("severity", "unknown")
            if severity not in severities:
                severities[severity] = 0
            severities[severity] += 1
        
        # Print summary by severity
        for severity, count in severities.items():
            color = Colors.RED if severity in ["error", "critical"] else Colors.YELLOW
            print(f"{color}{severity.capitalize()}: {count}{Colors.END}")
        
        # Group issues by rule
        rules = {}
        for issue in issues:
            rule = issue.get("rule", "unknown")
            if rule != "unknown":
                if rule not in rules:
                    rules[rule] = 0
                rules[rule] += 1
        
        # Print top issues by rule
        if rules:
            print(f"\n{Colors.BLUE}Top issues by rule:{Colors.END}")
            for rule, count in sorted(rules.items(), key=lambda x: x[1], reverse=True)[:5]:
                print(f"  - {rule}: {count}")
    else:
        print(f"{Colors.YELLOW}Unexpected results format. Check the output file for details.{Colors.END}")

def main():
    """Main function"""
    args = parse_arguments()
    
    # Auto-detect repository root
    repo_root = find_repo_root()
    if not repo_root:
        print(f"{Colors.RED}Error: Could not find repository root.{Colors.END}")
        print(f"{Colors.YELLOW}Make sure you're running this script from within the repository or a subdirectory.{Colors.END}")
        sys.exit(1)
    
    print(f"{Colors.BLUE}Using repository root: {Colors.BOLD}{repo_root}{Colors.END}")
    
    # Check if we're doing a full analysis
    analyze_all = args.all or args.file_path is None
    
    # If not analyzing all, validate the file path
    file_path = None
    if not analyze_all:
        file_path = resolve_file_path(args.file_path)
        
        if not os.path.exists(file_path):
            print(f"{Colors.RED}Error: File not found: {file_path}{Colors.END}")
            sys.exit(1)
        
        if not os.path.isfile(file_path):
            print(f"{Colors.RED}Error: Not a file: {file_path}{Colors.END}")
            sys.exit(1)
    
    # Check Docker image
    if not check_docker_image(args.verbose):
        print(f"{Colors.RED}Failed to find or build ESLint Docker image. Exiting.{Colors.END}")
        sys.exit(1)
    
    # Run ESLint analysis
    if analyze_all:
        results = run_eslint_docker(None, repo_root, args.verbose, not args.no_cache, analyze_all=True)
    else:
        results = run_eslint_docker(file_path, repo_root, args.verbose, not args.no_cache)
    
    # Save results
    output_file = save_results(results, file_path, args.output_dir)
    print(f"{Colors.BLUE}Results saved to: {Colors.BOLD}{output_file}{Colors.END}")
    
    # Print summary
    print_summary(results)

if __name__ == "__main__":
    main()
