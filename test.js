console.log('PROCESS TYPE:', process.type);
console.log('VERSIONS:', process.versions);
console.log('IS ELECTRON:', !!process.versions.electron);
console.log('MODULE PATHS:', module.paths);
try {
    const electron = require('electron');
    console.log('ELECTRON IMPORT TYPE:', typeof electron);
    if (typeof electron === 'string') {
        console.log('ELECTRON IMPORT VALUE:', electron);
        console.log('RESOLVE:', require.resolve('electron'));
    }
} catch (e) {
    console.log('REQUIRE ERROR:', e.message);
}
if (typeof process.exit === 'function') process.exit(0);
