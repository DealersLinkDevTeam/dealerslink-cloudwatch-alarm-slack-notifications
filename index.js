const __ = require('@dealerslink/lodash-extended');
const config = require('./config/config');
const defaults = require('./config/default.config');
const baseConfig = __.merge(Object.assign({}, defaults), config);
// const pkg = require('./package.json');

const https = require('https');
const util = require('util');
const url = require('url');

const severities = {
  good: 0,
  warning: 1,
  danger: 2
};

class SlackNotifier {
  constructor(event, context, callback, options) {
    this.options = __.merge({ ignoreQueue: false }, options || {});
    this.event = event;
    this.context = context;
    this.callback = callback;

    this.hookChannel = this.options.hookChannel || baseConfig.hookChannel || 'general';
    this.hookURL = this.options.hookURL || baseConfig.hookURL;
  }

  formatFields(str) {
    const fields = [];
    let severity = severities.good;
    let message, deploymentOverview;

    try {
      message = JSON.parse(str);
    } catch (ex) {
      message = str;
    }

    // Make sure we have a valid response
    if (message) {
      let state = message.NewStateValue;
      switch (state) {
        case 'ALARM': {
          severity = severities.danger;
          break;
        }
        case 'INSUFFICIENT': {
          severity = severities.warning;
          break;
        }
        case 'OK': {
          severity = severities.good;
          break;
        }
        default: {
          severity = severities.warning;
          break;
        }

      }
      if (typeof message === 'object') {
        fields.push(
          { title: 'Name', value: message.AlarmName, short: true },
          { title: 'Status', value: message.NewStateValue, short: true },
          { title: 'Description', value: message.AlarmDescription, short: true },
          { title: 'Last Status', value: message.OldStateValue, short: true },
          { title: 'State Time', value: message.StateChangeTime, short: true },
          { title: 'Region', value: message.Region, short: true },
          { title: 'Reason', value: message.NewStateReason, short: false }
        );
      } else if (typeof message === 'string') {
        fields.push({ title: 'Message', value: message, short: false });
      }
    }

    return { fields: fields, severity: severity };
  }

  work(done) {
    console.log(JSON.stringify(this.event));

    // Skip if the event is empty or unset
    if (!this.event || __.isUnset(this.event.Records)) {
      done(null, 'No Records');
      return;
    }

    const record = this.event.Records[0];
    if (__.isUnset(record.Sns)) {
      done(null, 'No SNS Information');
      return;
    }

    const sns = record.Sns;
    const postData = {
      channel: `#${this.hookChannel}`,
      username: 'CloudWatch Alarm',
      text: `*${sns.Subject}*`,
      attachments: []
    };

    const { fields, severity } = this.formatFields(sns.Message);
    const messages = sns.Message;

    let color = '#36a64f';
    if ((severity & severities.danger) === severities.danger) {
      color = '#a63636';
    } else if ((severity & severities.warning) === severities.warning) {
      color = '#a68d36';
    }

    if (fields.length === 0) {
      fields.push({ title: 'Notes', value: 'No other information available', short: false });
    }

    postData.attachments.push({ fallback: `${sns.Subject}`, color: color, fields: fields });
    const service = url.parse(this.hookURL);

    const options = {
      method: 'POST',
      hostname: service.hostname,
      path: service.pathname
    };

    console.log(`Sending Request to ${this.hookURL}`);
    console.log(JSON.stringify(postData));

    const req = https.request(options, (res) => {
      res.setEncoding('utf8');
      res.on('data', () => {
        done(null);
      });
    });

    req.on('error', (ex) => {
      done(null, `Problem with request: ${ex.message}`);
    });

    req.write(util.format('%j', postData));
    req.end();
  }

  startup() {
    this.work((data, err) => {
      console.log('Data Sent');
      console.log(data);
      if (err) {
        console.log(err);
      }
    });
  }
}

exports.handler = function(event, context, callback, options) {
  const notifier = new SlackNotifier(event, context, callback, options);
  notifier.startup();
};
