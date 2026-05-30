const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { list, getOne, create, update, remove } = require('../controllers/itemsController');

router.use(authenticate);

router.get('/', list);
router.get('/:id', getOne);
router.post('/', create);
router.patch('/:id', update);
router.delete('/:id', remove);

module.exports = router;
