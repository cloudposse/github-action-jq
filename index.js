const core = require('@actions/core');
const io = require('@actions/io');
const tc = require('@actions/tool-cache');
const ex = require('@actions/exec');

//async function ensureBinDir() {
//  bindir = `${process.env.HOME}/.local/bin`
//  if (!fs.existsSync(bindir)) {
//    await io.mkdirP(bindir);
//    core.addPath(bindir);
//  }
//  if(!fs.statSync(bindir).isDirectory()) {
//    throw {"message": `${bindir} exists and is not directory`};
//  }
//  return bindir;
//}
//
//async function setup_jq(bindir) {
//  var jqPath = await io.which('jq', false);
//  if (! jqPath) {
//    const bindl = await tc.find("jq", "1.6")
//    const bindl = await tc.downloadTool("https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64");
//    const st = fs.statSync(bindl);
//    fs.chmodSync(bindl, st.mode | fs.constants.S_IXUSR | fs.constants.S_IXGRP | fs.constants.S_IXOTH);
//    await tc.cacheFile(bindl, 'jq', 'jq', '1.6');
//    jqPath = path.join([bindir, 'jq']);
//    await io.cp(bindl, jqPath);
//    if(!await io.which('jq', false)) {
//      core.addPath(bindir);
//    }
//  }
//}

function MissingBinary(program) {
  this.message = `${program} not installed on path`;
}

async function findBinary() {
  let binpath = await io.which('jq', false);
  if (!binpath) {
    binpath = await tc.find('jq', '*');
    if(!binpath) {
      throw new MissingBinary('jq');
    }
  }
  return binpath;
}

async function run() {
  try {
    var output = '';
    const jq = await findBinary();
    const input = core.getInput("input", {required: true});
    const script = core.getInput("script", {required: true});
    const flags = [];
    const args = [];
    if (core.getInput("compact") === 'true') {
      flags.push('c');
    }
    if (core.getInput("raw-output") === 'true') {
      flags.push('r');
    }

    if (flags.length > 0) {
      args.push(`-${flags.join('')}`);
    }

    args.push(script);

    const context = {
      listeners: {
        stdout: (data) => {
          output += data.toString();
        }
      }
    }

    if (fs.existsSync(input)) {
      args.push(input);
    } else {
      context["input"] = Buffer.from(input, 'utf8')
    }

    await ex.exec(jq, args, context);
    if (core.getInput("remove-trailing-newline", {required: false}) === "true") {
      output = output.replace(/\r?\n$/, "");
    }
    core.setOutput('output', output);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
