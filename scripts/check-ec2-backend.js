const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROFILE = 'simplicion';
const REGION = 'us-east-1';
const INSTANCE_ID = 'i-09f7f4e8ae6805420';

async function run() {
  const ec2Info = JSON.parse(execSync(`aws ec2 describe-instances --profile ${PROFILE} --region ${REGION} --instance-ids "${INSTANCE_ID}" --output json`, { encoding: 'utf8' }));
  const inst = ec2Info.Reservations[0]?.Instances[0];
  const publicIp = inst?.PublicIpAddress;
  const az = inst?.Placement?.AvailabilityZone;

  console.log(`Target EC2: IP = ${publicIp}, AZ = ${az}`);

  const keyPath = path.join(__dirname, '../temp_ec2_key');
  const pubKeyPath = `${keyPath}.pub`;
  const pubKeyContent = fs.readFileSync(pubKeyPath, 'utf8').trim();

  execSync(`aws ec2-instance-connect send-ssh-public-key --profile ${PROFILE} --region ${REGION} --instance-id "${INSTANCE_ID}" --instance-os-user ubuntu --availability-zone "${az}" --ssh-public-key "${pubKeyContent}" --output json`, {
    encoding: 'utf8'
  });

  const commands = [
    'echo "=== DOCKER CONTAINERS ==="',
    'sudo docker ps -a',
    'echo "=== LOKAYA BACKEND LOGS ==="',
    'sudo docker logs --tail 30 lokaya-backend',
    'echo "=== ENV VARS ==="',
    'sudo docker exec lokaya-backend printenv DATABASE_URL',
    'sudo docker exec lokaya-backend printenv NODE_ENV'
  ].join(' && ');

  const sshCmd = `ssh -i "${keyPath}" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 ubuntu@${publicIp} "${commands}"`;
  const output = execSync(sshCmd, { encoding: 'utf8' });
  console.log(output);
}

run().catch(console.error);
