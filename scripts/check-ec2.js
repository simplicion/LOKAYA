const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROFILE = 'simplicion';
const REGION = 'us-east-1';
const INSTANCE_ID = 'i-09f7f4e8ae6805420';

function runAws(cmd) {
  return execSync(`aws ${cmd} --profile ${PROFILE} --region ${REGION} --no-cli-pager --output json`, {
    encoding: 'utf8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeRemote(commands) {
  const paramFile = path.join(__dirname, 'ssm-params.json');
  fs.writeFileSync(paramFile, JSON.stringify({ commands }));
  
  const sendRes = JSON.parse(execSync(`aws ssm send-command --profile ${PROFILE} --region ${REGION} --instance-ids "${INSTANCE_ID}" --document-name "AWS-RunShellScript" --parameters "file://${paramFile.replace(/\\/g, '/')}" --output json`, {
    encoding: 'utf8',
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
  }));
  
  const cmdId = sendRes.Command.CommandId;
  console.log(`Sent SSM command ${cmdId}, waiting for execution...`);

  for (let i = 0; i < 20; i++) {
    await sleep(3000);
    const invRes = JSON.parse(execSync(`aws ssm get-command-invocation --profile ${PROFILE} --region ${REGION} --command-id "${cmdId}" --instance-id "${INSTANCE_ID}" --output json`, {
      encoding: 'utf8',
      env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' }
    }));
    
    if (invRes.Status === 'Success' || invRes.Status === 'Failed' || invRes.Status === 'TimedOut' || invRes.Status === 'Cancelled') {
      console.log(`Status: ${invRes.Status}`);
      console.log('--- STDOUT ---');
      console.log(invRes.StandardOutputContent);
      console.log('--- STDERR ---');
      console.log(invRes.StandardErrorContent);
      return invRes;
    }
    console.log(`Current status: ${invRes.Status}...`);
  }
}

async function main() {
  await executeRemote([
    'sudo nginx -t',
    'LANG=C sudo systemctl is-active nginx',
    'curl -i -H "Host: api.lokaya.shop" http://127.0.0.1/health'
  ]);
}

main().catch(console.error);
