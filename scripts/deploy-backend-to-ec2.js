const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const INSTANCE_ID = 'i-09f7f4e8ae6805420';
const PROFILE = 'simplicion';
const REGION = 'us-east-1';

function run(cmd) {
  return execSync(cmd, {
    encoding: 'utf8',
    env: { ...process.env, AWS_PAGER: '', GH_PAGER: '' },
    stdio: ['pipe', 'pipe', 'pipe']
  });
}

function runAws(awsCmd) {
  const full = `aws ${awsCmd} --profile ${PROFILE} --region ${REGION} --no-cli-pager --output json`;
  const out = run(full);
  return JSON.parse(out);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('🚀 Deploying Lokaya Backend Container to EC2 (' + INSTANCE_ID + ')...');

  // 1. Get GHCR auth token
  const token = run('gh auth token').trim();
  console.log('Obtained GitHub auth token.');

  // 2. Prepare deployment commands
  const commands = [
    `echo "${token}" | docker login ghcr.io -u Prince364133 --password-stdin`,
    'echo "Pulling latest Lokaya backend image..."',
    'docker pull ghcr.io/prince364133/lokaya-backend:latest',
    'echo "Replacing container..."',
    'docker stop lokaya-backend 2>/dev/null || true',
    'docker rm lokaya-backend 2>/dev/null || true',
    'docker run -d --name lokaya-backend --restart unless-stopped --network host --env-file /opt/lokaya/.env ghcr.io/prince364133/lokaya-backend:latest',
    'echo "Verifying health..."',
    'sleep 8',
    'curl -I http://127.0.0.1:4002/health || true',
    'docker ps --filter name=lokaya-backend'
  ];

  const paramsPath = path.join(__dirname, 'deploy-auth-cmd.json');
  fs.writeFileSync(paramsPath, JSON.stringify({ commands }, null, 2));

  // 3. Send SSM Command
  const sendRes = runAws(`ssm send-command --instance-ids ${INSTANCE_ID} --document-name "AWS-RunShellScript" --parameters file://${paramsPath.replace(/\\/g, '/')}`);
  const commandId = sendRes.Command.CommandId;
  console.log(`SSM Command sent with ID: ${commandId}`);

  // 4. Poll for completion
  console.log('Waiting for deployment to complete on EC2...');
  for (let i = 0; i < 30; i++) {
    await sleep(6000);
    try {
      const inv = runAws(`ssm get-command-invocation --command-id ${commandId} --instance-id ${INSTANCE_ID}`);
      const status = inv.Status;
      console.log(`Status: ${status} (attempt ${i + 1})`);
      if (status === 'Success' || status === 'Failed') {
        console.log('\n========================================');
        console.log('COMMAND STDOUT:');
        console.log(inv.StandardOutputContent);
        if (inv.StandardErrorContent) {
          console.log('COMMAND STDERR:');
          console.log(inv.StandardErrorContent);
        }
        console.log('========================================');
        break;
      }
    } catch (e) {
      // In-progress invocations may temporarily not be queryable
    }
  }

  // Clean up params file with token
  if (fs.existsSync(paramsPath)) {
    fs.unlinkSync(paramsPath);
  }

  console.log('\nTesting live HTTP health from outside...');
  try {
    const httpCheck = execSync('curl -s -o /dev/null -w "%{http_code}" http://32.197.221.59/health', { encoding: 'utf8' }).trim();
    console.log(`HTTP GET http://32.197.221.59/health => Code: ${httpCheck}`);
  } catch(e) {
    console.log('External HTTP check result:', e.message);
  }
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
