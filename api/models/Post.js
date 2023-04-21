const mongoose = require('mongoose')
const { model, Schema } = mongoose

const PostSchema = new Schema(
  {
    title: String,
    summary: String,
    context: String,
    cover: String,
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

const PostModel = model('Post', PostSchema)
module.exports = PostModel
