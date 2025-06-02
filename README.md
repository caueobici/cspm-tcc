# AWS CSPM (Cloud Security Posture Management)

A modular Cloud Security Posture Management tool for AWS that allows you to define and evaluate security rules across different AWS services.

## Features

- Modular architecture for AWS services
- YAML-based rule definitions
- Support for complex conditions including AND/OR operators
- Extensible rule system
- CLI interface

## Installation

1. Clone the repository
2. Install dependencies:
```bash
pnpm install
```

## Configuration

The tool uses AWS credentials from your environment. Make sure you have:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION

set in your environment or in `~/.aws/credentials`.

Note that the user must have these permissions:
- `arn:aws:iam::aws:policy/SecurityAudit`
- `arn:aws:iam::aws:policy/job-function/ViewOnlyAccess`

## Usage

Run a security scan:
```bash
pnpm start scan
```

Options:
- `-r, --rules-dir <path>`: Directory containing rule files (default: ./rules)
- `-m, --modules-dir <path>`: Directory containing AWS service modules (default: ./src/modules)

## Rule Format

Rules are defined in YAML files with the following structure:

```yaml
module: <module_name>
meta:
  name: "Rule name"
  description: "Rule description"
  severity: "high|medium|low"
  category: "category"

condition:
  <field_name> == <string> OR <f1.field2> ~= "<regex>"
```

### Condition Operators

- `==`: Equality check
- `~=`: Regex pattern match
- `AND`: Boolean AND
- `OR`: Boolean OR

### Field Access

Fields can be accessed using dot notation:
- `bucket.name`: Access the name field of a bucket
- `tags.Environment`: Access the Environment tag

## Adding New Rules

1. Create a new YAML file in the `rules` directory
2. Follow the rule format described above
3. Use the appropriate module name and field names

## Adding New Modules

1. Create a new directory in `src/modules/<service-name>`
2. Create an `index.js` file that extends the `AWSModule` class
3. Implement the `getData()` method to return service-specific data
4. Export a singleton instance of your module

## Example Rule

```yaml
module: s3
meta:
  name: "Check for virus-s3 bucket"
  description: "Detects if there is a bucket named 'virus-s3'"
  severity: "high"
  category: "naming"

condition:
name == "virus-s3"
```

## License

Apache License 2.0
