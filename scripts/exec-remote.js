const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROFILE = 'simplicion';
const REGION = 'us-east-1';
const INSTANCE_ID = 'i-09f7f4e8ae6805420';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run(commands) {
  const paramFile = path.join(__dirname, `temp-ssm-${Date.now()}.json`);
  fs.writeFileSync(paramFile, JSON.stringify({ commands: Array.isArray(commands) ? commands : [commands] }));

  try {
    const sendRes = JSON.parse(execSync(
      `aws ssm send-command --profile ${PROFILE} --region ${REGION} --instance-ids "${INSTANCE_ID}" --document-name "AWS-RunShellScript" --parameters "file://${paramFile.replace(/\\/g, '/')}" --output json`,
      { encoding: 'utf8', env: { ...process.env, AWS_PAGER: '' } }
    ));

    const cmdId = sendRes.Command.CommandId;

    for (let i = 0; i < 25; i++) {
      await sleep(2500);
      const invRes = JSON.parse(execSync(
        `aws ssm get-command-invocation --profile ${PROFILE} --region ${REGION} --command-id "${cmdId}" --instance-id "${INSTANCE_ID}" --output json`,
        { encoding: 'utf8', env: { ...process.env, AWS_PAGER: '' } }
      ));

      if (['Success', 'Failed', 'TimedOut', 'Cancelled'].includes(invRes.Status)) {
        console.log(`[${invRes.Status}]`);
        if (invRes.StandardOutputContent) console.log(invRes.StandardOutputContent);
        if (invRes.StandardErrorContent) console.error(invRes.StandardErrorContent);
        return invRes;
      }
    }
    console.log('Timeout waiting for SSM execution');
  } finally {
    if (fs.existsSync(paramFile)) fs.unlinkSync(paramFile);
  }
}

if (process.argv[2]) {
  run(process.argv.slice(2)).catch(console.error);
} else {
  module.exports = { run };
}
