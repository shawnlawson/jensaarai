'use babel'

// http://stackoverflow.com/questions/9210542/node-js-require-cache-possible-to-invalidate
export default function(module) {
  delete require.cache[require.resolve(module)]
  return require(module)
}
