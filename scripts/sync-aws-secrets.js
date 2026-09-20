const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const p = path.join(os.homedir(), '.aws', 'credentials');
const creds = fs.readFileSync(p, 'utf8');
const lines = creds.split('\n');
let inSimplicion = false;
let keyId = '', secretKey = '';

for (const line of lines) {
  const l = line.trim();
  if (l === '[simplicion]') inSimplicion = true;
  else if (l.startsWith('[') && l !== '[simplicion]') inSimplicion = false;
  else if (inSimplicion) {
    if (l.startsWith('aws_access_key_id')) keyId = l.split('=')[1].trim();
    if (l.startsWith('aws_secret_access_key')) secretKey = l.split('=')[1].trim();
  }
}

console.log('Simplicion key found:', keyId ? 'yes' : 'no');
if (keyId && secretKey) {
  execSync(`gh secret set AWS_ACCESS_KEY_ID --body "${keyId}"`, { stdio: 'inherit' });
  execSync(`gh secret set AWS_SECRET_ACCESS_KEY --body "${secretKey}"`, { stdio: 'inherit' });
  execSync(`gh secret set AWS_REGION --body "us-east-1"`, { stdio: 'inherit' });
  execSync(`gh secret set AWS_EC2_INSTANCE_ID --body "i-09f7f4e8ae6805420"`, { stdio: 'inherit' });
  console.log('Successfully synced AWS secrets for EC2 to GitHub Secrets!');
}
