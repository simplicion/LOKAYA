const { execSync } = require('child_process');

const accounts = [
  { profile: 'simplicion', id: '882862136872', name: 'Simplicion / Pitchin' },
  { profile: 'default', id: '850798752083', name: 'Prince / Antigravity' }
];

const regions = ['us-east-1', 'ap-south-1'];

function run(cmd) {
  try {
    const res = execSync(cmd, {
      timeout: 12000,
      encoding: 'utf8',
      env: { ...process.env, AWS_PAGER: '' },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return JSON.parse(res);
  } catch (e) {
    return null;
  }
}

async function scan() {
  const result = {};

  for (const acc of accounts) {
    result[acc.id] = {
      name: acc.name,
      profile: acc.profile,
      s3Buckets: [],
      ec2: [],
      rds: [],
      lightsail: []
    };

    // S3
    const s3 = run(`aws s3api list-buckets --profile ${acc.profile} --output json`);
    if (s3 && s3.Buckets) {
      result[acc.id].s3Buckets = s3.Buckets.map(b => b.Name);
    }

    for (const r of regions) {
      // EC2
      const ec2 = run(`aws ec2 describe-instances --profile ${acc.profile} --region ${r} --no-cli-pager --output json`);
      if (ec2 && ec2.Reservations) {
        for (const resv of ec2.Reservations) {
          for (const inst of resv.Instances) {
            const name = (inst.Tags || []).find(t => t.Key === 'Name')?.Value || 'Unnamed';
            result[acc.id].ec2.push({
              region: r,
              id: inst.InstanceId,
              name,
              type: inst.InstanceType,
              state: inst.State.Name,
              publicIp: inst.PublicIpAddress || 'N/A',
              privateIp: inst.PrivateIpAddress || 'N/A',
              launchTime: inst.LaunchTime
            });
          }
        }
      }

      // RDS
      const rds = run(`aws rds describe-db-instances --profile ${acc.profile} --region ${r} --no-cli-pager --output json`);
      if (rds && rds.DBInstances) {
        for (const db of rds.DBInstances) {
          result[acc.id].rds.push({
            region: r,
            id: db.DBInstanceIdentifier,
            engine: `${db.Engine} ${db.EngineVersion}`,
            class: db.DBInstanceClass,
            status: db.DBInstanceStatus,
            endpoint: db.Endpoint?.Address || 'N/A',
            storage: `${db.AllocatedStorage} GB`
          });
        }
      }

      // Lightsail
      const ls = run(`aws lightsail get-instances --profile ${acc.profile} --region ${r} --output json`);
      if (ls && ls.instances) {
        for (const inst of ls.instances) {
          result[acc.id].lightsail.push({
            region: r,
            name: inst.name,
            bundle: inst.bundleId,
            state: inst.state.name,
            publicIp: inst.publicIpAddress || 'N/A'
          });
        }
      }
    }
  }

  console.log(JSON.stringify(result, null, 2));
}

scan().catch(console.error);
