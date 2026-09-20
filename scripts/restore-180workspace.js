const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROFILE = 'simplicion';
const REGION = 'us-east-1';
const AMI_ID = 'ami-052355af2a014bd2c';
const INSTANCE_TYPE = 't3.small';
const KEY_NAME = '180workspace-key';
const SG_ID = 'sg-05f5a0413618c4b9f';
const SUBNET_ID = 'subnet-043b18cb7c6d444d7';
const IAM_PROFILE_ARN = 'arn:aws:iam::882862136872:instance-profile/180workspace-ec2-ssm-profile';

function run(cmd) {
  return execSync(cmd, {
    encoding: 'utf8',
    env: { ...process.env, AWS_PAGER: '' },
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
  console.log('================================================================');
  console.log('🔄 Restoring 180workspace-backend EC2 Instance (t3.small)');
  console.log('================================================================');

  // 1. Read provision.sh
  const provisionPath = 'C:\\Users\\saavi\\Desktop\\180workspace\\provision.sh';
  let userDataBase64 = '';
  if (fs.existsSync(provisionPath)) {
    const content = fs.readFileSync(provisionPath, 'utf8');
    userDataBase64 = Buffer.from(content).toString('base64');
    console.log('Loaded provision.sh from 180workspace directory.');
  }

  // 2. Launch instance
  console.log('Launching new 180workspace-backend EC2 instance...');
  const launchArgs = [
    'ec2', 'run-instances',
    `--image-id ${AMI_ID}`,
    `--instance-type ${INSTANCE_TYPE}`,
    `--key-name ${KEY_NAME}`,
    `--security-group-ids ${SG_ID}`,
    `--subnet-id ${SUBNET_ID}`,
    `--iam-instance-profile Arn=${IAM_PROFILE_ARN}`,
    `--tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=180workspace-backend}]"`
  ];

  if (userDataBase64) {
    launchArgs.push(`--user-data "${userDataBase64}"`);
  }

  const launchRes = runAws(launchArgs.join(' '));
  const instance = launchRes.Instances[0];
  const instanceId = instance.InstanceId;
  console.log(`✅ Launched instance: ${instanceId}`);

  // 3. Wait for running
  console.log('Waiting for instance to become running...');
  let publicIp = '';
  for (let i = 0; i < 20; i++) {
    await sleep(5000);
    const desc = runAws(`ec2 describe-instances --instance-ids ${instanceId}`);
    const inst = desc.Reservations[0].Instances[0];
    const state = inst.State.Name;
    publicIp = inst.PublicIpAddress || '';
    console.log(`State: ${state} | IP: ${publicIp || 'pending...'}`);
    if (state === 'running' && publicIp) break;
  }

  console.log('\n================================================================');
  console.log('🎉 180workspace-backend EC2 Instance Successfully Restored!');
  console.log(`Instance ID: ${instanceId}`);
  console.log(`Instance Type: ${INSTANCE_TYPE}`);
  console.log(`Public IPv4: ${publicIp}`);
  console.log('================================================================');
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
