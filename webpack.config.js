let path = require('path')

module.exports = {
    devServer:{
        port:8080,
        contentBase:'./dist'
    },
    mode:'development',
    entry:'./src/index.js',
    output:{
        filename:'bundle.js',
        path:path.resolve(__dirname,'dist')
    },
}