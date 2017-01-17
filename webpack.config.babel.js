import path from 'path'
import webpack from 'webpack'

const { NODE_ENV } = process.env

const plugins = [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
  }),
]

const filename = `redux-promise-bind${NODE_ENV === 'production' ? '.min' : ''}.js`

NODE_ENV === 'production' && plugins.push(
  new webpack.optimize.UglifyJsPlugin({
    compressor: {
      pure_getters: true,
      unsafe: true,
      unsafe_comps: true,
      screw_ie8: true,
      warnings: false,
    },
  })
)

export default {
  entry: ['./src/index'],

  output: {
    path: path.join(__dirname, 'dist'),
    filename,
    library: 'ReduxPromiseBind',
    libraryTarget: 'umd',
  },

  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    extensions: ['.js', '.jsx'],
  },

  plugins,

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
    ],
  },
}
