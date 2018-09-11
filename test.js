const tester = require('./index');

const messageTestData = {
  AlarmName: 'Example alarm name',
  AlarmDescription: 'Example alarm description.',
  AWSAccountId: '000000000000',
  NewStateValue: 'ALARM',
  NewStateReason: 'Threshold Crossed: 1 datapoint (10.0) was greater than or equal to the threshold (1.0).',
  StateChangeTime: '2017-01-12T16:30:42.236+0000',
  Region: 'EU - Ireland',
  OldStateValue: 'OK',
  Trigger: {
    MetricName: 'DeliveryErrors',
    Namespace: 'ExampleNamespace',
    Statistic: 'SUM',
    Unit: null,
    Dimensions: [],
    Period: 300,
    EvaluationPeriods: 1,
    ComparisonOperator: 'GreaterThanOrEqualToThreshold',
    Threshold: 1
  }
};

const testData = {
  Type: 'Notification',
  MessageId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  TopicArn: 'arn:aws:sns:eu-west-1:000000000000:cloudwatch-alarms',
  Subject: 'ALARM: "Example alarm name" in EU - Ireland',
  Timestamp: '2017-01-12T16:30:42.318Z',
  SignatureVersion: '1',
  Signature: 'Cg==',
  SigningCertUrl: 'https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.pem',
  UnsubscribeUrl: 'https://sns.eu-west-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-west-1:000000000000:cloudwatch-alarms:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  Message: JSON.stringify(messageTestData),
  MessageAttributes: {}
};

const data = JSON.stringify(testData);
tester.handler(
  {
    Records: [
      {
        Sns: {
          Subject: 'Test',
          Message: data
        }
      }
    ]
  },
  null,
  (res) => {
    if (res) {
      console.log(res);
    }
  },
  {}
);
