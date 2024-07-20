import log4js from 'log4js';
import * as fs from 'fs';

export function initLog4js(filePath:string) {
  try {
    const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    log4js.configure(config);
  } catch (_:any) {
    log4js.configure({
      "appenders": {
        "console": {
          "type": "console"
        },
        "app": {
          "type": "dateFile",
          "filename": "/opt/logs/mediasoup.log",
          "pattern": "yyyy-MM-dd",
          "numBackups": 7,
          "compress": true
        },
        "access": {
          "type": "dateFile",
          "filename": "/opt/logs/access.log",
          "pattern": "yyyy-MM-dd",
          "numBackups": 7,
          "compress": true
        }
      },
      "categories": {
        "default": {
          "appenders": ["console", "app"],
          "level": "all",
          "enableCallStack": true
        },
        "access": { 
          "appenders": ["console", "access"], 
          "level": "all"
        }
      }
    });
  }
}
