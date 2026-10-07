const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const INSTANCE_ID = 'i-09f7f4e8ae6805420';
const PROFILE = 'simplicion';
const REGION = 'us-east-1';

function runAws(awsCmd) {
  const full = `aws ${awsCmd} --profile ${PROFILE} --region ${REGION} --no-cli-pager --output json`;
  const out = execSync(full, { encoding: 'utf8', env: { ...process.env, AWS_PAGER: '' } });
  return JSON.parse(out);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('Inspecting backend on EC2...');
  const commands = [
    'echo "=== DOCKER LOGS (LAST 40 LINES) ==="',
    'sudo docker logs --tail 40 lokaya-backend',
    'echo "=== CHECKING DB CONNECTIVITY FROM CONTAINER ==="',
    'sudo docker exec lokaya-backend node -e "const { PrismaClient } = require(\'@prisma/client\'); const prisma = new PrismaClient(); prisma.\\$connect().then(() => console.log(\'PRISMA CONNECTED SUCCESSFULLY\')).catch(e => console.error(\'PRISMA CONNECT ERROR:\', e.message));"',
    'echo "=== CHECKING .env FILE PERMISSIONS & DB URL MASKED ==="',
    'sudo grep -i database /opt/lokaya/.env | sed \'s/:[^:@]*@/:***@/\'',
    'echo "=== CHECKING CONTAINER ENV ==="',
    'sudo docker exec lokaya-backend printenv DATABASE_URL | sed \'s/:[^:@]*@/:***@/\''
  ];

  const paramsPath = path.join(__dirname, 'diag-params.json');
  fs.writeFileSync(paramsPath, JSON.stringify({ commands }, null, 2));

  const sendRes = runAws(`ssm send-command --instance-ids ${INSTANCE_ID} --document-name "AWS-RunShellScript" --parameters file://${paramsPath.replace(/\\/g, '/')}`);
  const commandId = sendRes.Command.CommandId;
  console.log('SSM Command ID:', commandId);

  for (let i = 0; i < 20; i++) {
    await sleep(3000);
    try {
      const inv = runAws(`ssm get-command-invocation --command-id ${commandId} --instance-id ${INSTANCE_ID}`);
      if (inv.Status === 'Success' || inv.Status === 'Failed') {
        console.log('STATUS:', inv.Status);
        console.log('STDOUT:\n', inv.StandardOutputContent);
        if (inv.StandardErrorContent) console.log('STDERR:\n', inv.StandardErrorContent);
        break;
      }
    } catch (e) {}
  }

  if (fs.existsSync(paramsPath)) fs.unlinkSync(paramsPath);
}

main().catch(console.error);
