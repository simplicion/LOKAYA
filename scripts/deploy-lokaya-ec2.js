const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROFILE = 'simplicion';
const REGION = 'us-east-1';
const AMI_ID = 'ami-052355af2a014bd2c'; // Ubuntu 24.04 LTS
const INSTANCE_TYPE = 't3.small';
const KEY_NAME = '180workspace-key';
const SG_ID = 'sg-05f5a0413618c4b9f';
const SUBNET_ID = 'subnet-043b18cb7c6d444d7';
const IAM_PROFILE_ARN = 'arn:aws:iam::882862136872:instance-profile/180workspace-ec2-ssm-profile';

function run(cmd) {
  return execSync(cmd, {
    encoding: 'utf8',
    env: { ...process.env, AWS_PAGER: '', GH_PAGER: '' },
    stdio: ['pipe', 'pipe', 'pipe']
  });
}

function runAws(awsCmd) {
  const full = `aws ${awsCmd} --profile ${PROFILE} --region ${REGION} --no-cli-pager --output json`;
  try {
    const out = run(full);
    return JSON.parse(out);
  } catch (err) {
    console.error(`AWS Command failed: ${full}\nError: ${err.message}`);
    if (err.stderr) console.error(err.stderr);
    throw err;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('================================================================');
  console.log('🚀 Lokaya EC2 Automation & Provisioning');
  console.log('================================================================');

  // 1. Check existing instances
  console.log('\n[1/6] Checking for existing instances named "Lokaya"...');
  const desc = runAws(`ec2 describe-instances --filters "Name=tag:Name,Values=Lokaya" "Name=instance-state-name,Values=pending,running"`);
  let instance = null;

  for (const r of desc.Reservations || []) {
    for (const inst of r.Instances || []) {
      if (inst.State.Name === 'running' || inst.State.Name === 'pending') {
        instance = inst;
        break;
      }
    }
  }

  if (instance) {
    console.log(`Found existing active Lokaya instance: ${instance.InstanceId} (${instance.State.Name})`);
  } else {
    console.log('[2/6] Launching new Lokaya EC2 instance...');
    const userDataPath = path.join(__dirname, 'setup-lokaya-ec2.sh');
    const userDataContent = fs.readFileSync(userDataPath, 'utf8');
    const userDataBase64 = Buffer.from(userDataContent).toString('base64');

    const launchCmd = [
      'ec2', 'run-instances',
      `--image-id ${AMI_ID}`,
      `--instance-type ${INSTANCE_TYPE}`,
      `--key-name ${KEY_NAME}`,
      `--security-group-ids ${SG_ID}`,
      `--subnet-id ${SUBNET_ID}`,
      `--iam-instance-profile Arn=${IAM_PROFILE_ARN}`,
      `--tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=Lokaya}]"`,
      `--user-data "${userDataBase64}"`
    ].join(' ');

    const launchRes = runAws(launchCmd);
    instance = launchRes.Instances[0];
    console.log(`✅ Instance launched successfully: ${instance.InstanceId}`);
  }

  const instanceId = instance.InstanceId;
  console.log(`\nTarget Instance ID: ${instanceId}`);

  // 3. Wait for running state & get public IP
  console.log('\n[3/6] Waiting for instance to enter "running" state...');
  let publicIp = instance.PublicIpAddress;
  for (let i = 0; i < 30; i++) {
    const check = runAws(`ec2 describe-instances --instance-ids ${instanceId}`);
    const current = check.Reservations[0].Instances[0];
    const state = current.State.Name;
    publicIp = current.PublicIpAddress;
    console.log(`State: ${state} | Public IP: ${publicIp || 'pending...'}`);
    if (state === 'running' && publicIp) {
      break;
    }
    await sleep(5000);
  }

  console.log(`\n🎉 Instance is running!`);
  console.log(`- Instance ID: ${instanceId}`);
  console.log(`- Public IPv4: ${publicIp}`);
  console.log(`- Public DNS: ec2-${publicIp.replace(/\\./g, '-')}.compute-1.amazonaws.com`);

  // 4. Update GitHub Secrets
  console.log('\n[4/6] Updating GitHub Actions Secret: AWS_EC2_INSTANCE_ID...');
  try {
    run(`gh secret set AWS_EC2_INSTANCE_ID --body "${instanceId}"`);
    console.log(`✅ GitHub secret AWS_EC2_INSTANCE_ID set to: ${instanceId}`);
  } catch (e) {
    console.error(`Failed to set GitHub secret: ${e.message}`);
  }

  // 5. Wait for AWS SSM Agent to become Online
  console.log('\n[5/6] Waiting for AWS SSM Agent to register "Online"...');
  let ssmOnline = false;
  for (let i = 0; i < 30; i++) {
    try {
      const ssmRes = runAws(`ssm describe-instance-information --filters "Key=InstanceIds,Values=${instanceId}"`);
      const info = ssmRes.InstanceInformationList?.[0];
      if (info && info.PingStatus === 'Online') {
        console.log(`✅ SSM Agent is Online! Agent Version: ${info.AgentVersion}`);
        ssmOnline = true;
        break;
      } else {
        console.log(`SSM status: ${info ? info.PingStatus : 'registering...'} (attempt ${i + 1}/30)`);
      }
    } catch (e) {
      console.log(`Waiting for SSM registration...`);
    }
    await sleep(6000);
  }

  // 6. Trigger Backend CI/CD Workflow
  console.log('\n[6/6] Triggering GitHub Actions Backend Deployment...');
  try {
    const triggerRes = run('gh workflow run centralized-cicd.yml -f target=backend');
    console.log(`✅ Workflow triggered successfully!`);
    console.log(triggerRes);
  } catch (e) {
    console.error(`Failed to trigger workflow: ${e.message}`);
  }

  console.log('\n================================================================');
  console.log('SUMMARY FOR USER & CLOUDFLARE DNS CONFIGURATION:');
  console.log(`1. New EC2 Instance ID: ${instanceId}`);
  console.log(`2. New Public IP: ${publicIp}`);
  console.log(`3. Cloudflare DNS Record to add/update:`);
  console.log(`   Type: A`);
  console.log(`   Name: api`);
  console.log(`   Target IPv4: ${publicIp}`);
  console.log(`   Proxy status: DNS only (Gray cloud) or Proxied (Orange cloud with SSL configured)`);
  console.log('================================================================');
}

main().catch(err => {
  console.error('Execution failed:', err);
  process.exit(1);
});
