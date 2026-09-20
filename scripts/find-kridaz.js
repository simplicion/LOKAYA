const { execSync } = require('child_process');

const profiles = ['default', 'simplicion', 'pitchin', 'prince'];
const regions = ['us-east-1', 'ap-south-1', 'ap-southeast-1'];

function run(cmd) {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      env: { ...process.env, AWS_PAGER: '' },
      stdio: ['pipe', 'pipe', 'pipe']
    });
  } catch (e) {
    return null;
  }
}

console.log('Searching for any instance or resource with "kridaz"...');

for (const p of profiles) {
  for (const r of regions) {
    // EC2
    const ec2Out = run(`aws ec2 describe-instances --profile ${p} --region ${r} --no-cli-pager --output json`);
    if (ec2Out) {
      try {
        const json = JSON.parse(ec2Out);
        for (const resv of json.Reservations || []) {
          for (const inst of resv.Instances || []) {
            const name = (inst.Tags || []).find(t => t.Key === 'Name')?.Value || 'Unnamed';
            console.log(`[EC2] Profile: ${p} | Region: ${r} | ID: ${inst.InstanceId} | Name: "${name}" | State: ${inst.State.Name} | IP: ${inst.PublicIpAddress}`);
          }
        }
      } catch (e) {}
    }

    // Lightsail
    const lsOut = run(`aws lightsail get-instances --profile ${p} --region ${r} --output json`);
    if (lsOut) {
      try {
        const json = JSON.parse(lsOut);
        for (const inst of json.instances || []) {
          console.log(`[LIGHTSAIL] Profile: ${p} | Region: ${r} | Name: "${inst.name}" | State: ${inst.state.name} | IP: ${inst.publicIpAddress}`);
        }
      } catch (e) {}
    }

    // RDS
    const rdsOut = run(`aws rds describe-db-instances --profile ${p} --region ${r} --output json`);
    if (rdsOut) {
      try {
        const json = JSON.parse(rdsOut);
        for (const db of json.DBInstances || []) {
          console.log(`[RDS] Profile: ${p} | Region: ${r} | DB: "${db.DBInstanceIdentifier}" | Status: ${db.DBInstanceStatus} | Endpoint: ${db.Endpoint?.Address}`);
        }
      } catch (e) {}
    }
  }
}
