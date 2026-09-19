const { execSync } = require('child_process');

const profiles = [
  { name: 'default', account: '850798752083' },
  { name: 'simplicion', account: '882862136872' }
];

const regions = ['ap-south-1', 'us-east-1', 'ap-southeast-1'];

function runAws(cmd, profile) {
  try {
    const fullCmd = `aws ${cmd} --profile ${profile} --output json`;
    const res = execSync(fullCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 20000 });
    return JSON.parse(res);
  } catch (err) {
    return { error: err.message.split('\n')[0] };
  }
}

async function inspect() {
  const report = {};

  for (const p of profiles) {
    console.log(`\n========================================`);
    console.log(`Scanning Profile: ${p.name} (Account: ${p.account})`);
    console.log(`========================================`);
    report[p.name] = {
      account: p.account,
      s3Buckets: [],
      ec2Instances: [],
      lightsailInstances: [],
      lightsailDatabases: [],
      rdsDatabases: [],
      ecsClusters: []
    };

    // 1. S3 Buckets
    try {
      const s3Res = runAws('s3api list-buckets', p.name);
      if (s3Res && s3Res.Buckets) {
        report[p.name].s3Buckets = s3Res.Buckets.map(b => ({ name: b.Name, createdAt: b.CreationDate }));
        console.log(`Found ${report[p.name].s3Buckets.length} S3 bucket(s)`);
      }
    } catch (e) {
      console.log('S3 error:', e.message);
    }

    // 2. Lightsail (Check ap-south-1 and us-east-1)
    for (const r of ['ap-south-1', 'us-east-1']) {
      try {
        const lsRes = runAws(`lightsail get-instances --region ${r}`, p.name);
        if (lsRes && lsRes.instances && lsRes.instances.length > 0) {
          report[p.name].lightsailInstances.push(...lsRes.instances.map(i => ({
            name: i.name,
            region: r,
            blueprint: i.blueprintId,
            bundle: i.bundleId,
            state: i.state.name,
            publicIp: i.publicIpAddress,
            privateIp: i.privateIpAddress,
            createdAt: i.createdAt
          })));
        }

        const lsDbRes = runAws(`lightsail get-relational-databases --region ${r}`, p.name);
        if (lsDbRes && lsDbRes.relationalDatabases && lsDbRes.relationalDatabases.length > 0) {
          report[p.name].lightsailDatabases.push(...lsDbRes.relationalDatabases.map(d => ({
            name: d.name,
            region: r,
            engine: d.engine,
            state: d.state,
            masterEndpoint: d.masterEndpoint?.address,
            bundle: d.relationalDatabaseBundleId
          })));
        }
      } catch (e) {
        // ignore lightsail region error
      }
    }
    console.log(`Found ${report[p.name].lightsailInstances.length} Lightsail instance(s)`);
    console.log(`Found ${report[p.name].lightsailDatabases.length} Lightsail database(s)`);

    // 3. EC2 Instances across regions
    for (const r of regions) {
      try {
        const ec2Res = runAws(`ec2 describe-instances --region ${r}`, p.name);
        if (ec2Res && ec2Res.Reservations) {
          for (const resv of ec2Res.Reservations) {
            for (const inst of resv.Instances || []) {
              const nameTag = (inst.Tags || []).find(t => t.Key === 'Name')?.Value || 'Unnamed';
              report[p.name].ec2Instances.push({
                instanceId: inst.InstanceId,
                name: nameTag,
                type: inst.InstanceType,
                state: inst.State.Name,
                publicIp: inst.PublicIpAddress || 'N/A',
                privateIp: inst.PrivateIpAddress || 'N/A',
                region: r,
                launchTime: inst.LaunchTime
              });
            }
          }
        }
      } catch (e) {}

      // 4. RDS
      try {
        const rdsRes = runAws(`rds describe-db-instances --region ${r}`, p.name);
        if (rdsRes && rdsRes.DBInstances) {
          report[p.name].rdsDatabases.push(...rdsRes.DBInstances.map(db => ({
            id: db.DBInstanceIdentifier,
            engine: db.Engine,
            engineVersion: db.EngineVersion,
            status: db.DBInstanceStatus,
            endpoint: db.Endpoint?.Address,
            allocatedStorage: db.AllocatedStorage,
            region: r
          })));
        }
      } catch (e) {}

      // 5. ECS
      try {
        const ecsRes = runAws(`ecs list-clusters --region ${r}`, p.name);
        if (ecsRes && ecsRes.clusterArns && ecsRes.clusterArns.length > 0) {
          report[p.name].ecsClusters.push(...ecsRes.clusterArns.map(arn => ({ arn, region: r })));
        }
      } catch (e) {}
    }

    console.log(`Found ${report[p.name].ec2Instances.length} EC2 instance(s)`);
    console.log(`Found ${report[p.name].rdsDatabases.length} RDS database(s)`);
    console.log(`Found ${report[p.name].ecsClusters.length} ECS cluster(s)`);
  }

  console.log('\n========================================');
  console.log('FINAL SCAN SUMMARY JSON');
  console.log('========================================');
  console.log(JSON.stringify(report, null, 2));
}

inspect().catch(console.error);
