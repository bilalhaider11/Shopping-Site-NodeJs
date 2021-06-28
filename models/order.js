const mongooes = require('mongoose');

const Schema = mongooes.Schema;

const orderSchema = new Schema({
    products: [
        {
            product: {type: Object, required: true},
            quantity: {type: Number, required: true}
        }
    ],
    user: {
        email: {type: String, required: true},
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        }
    }
});

module.exports = mongooes.model('Order', orderSchema);