# rope
test harness for [minq](https://npm.im/minq) queries

test all the things!

According to [The complete mink harness video](http://www.youtube.com/watch?v=eidzxk8HaxY), the best kind of rope to use is nylon.

## Stability

Experimental: Expect the unexpected. Please provide feedback on api and your use-case.

## installation

    $ npm install rope

## example usage

a [mocha](https://npm.im/mocha)-style test given:

`foo.js`:

    var minq = require('minq')

    module.exports = function () {
      return minq(process.env.DB).from('foos').toArray().then(function (foos) {
        // sure, we could have used a regex, but imagine more complicated application-level logic that you want to test against known database values
        return foos.filter(function (foo) { return foo.name.length > 3 })
      })
    }

`test-foo.js`:

    var rope = require('rope')
    var moquire = require('moquire')
    var chai = require('chai')
    chai.should()

    describe('foo', function () {
      it('returns names longer than 3 letters', function (done) {

        var spy = rope().stub({
           data: [
            {name: 'Al'},
            {name: 'Sue'},
            {name: 'Xerxes'}] 
          })
        var foo = moquire('foo', {minq: spy})

        foo().then(function (result) {
          result.should.deep.equal({name: 'Xerxes'})
        }).then(done, done)

      })
    })

## usage

### `rope() => MinqTestBuilder`

Constructor function. Returns a new MinqTestBuilder object.

### `MinqTestBuilder#stub(config) => MinqTestBuilder`

Chainable. Set up return values for queries. `config` is an object with these properties:

  - `data`: (required) The return value. Depending on the expected cardinality of the query (eg, `minq#one` vs `minq#toArray`), this should be an Array or a scalar Object.
  - `collection`: The expected collection of the query.
  - `where`: The expected conditional clause of the query.

## Stub dispatch

When a single test is expecting multiple queries, you can distinguish return values by collection. For example, to test this:
  
    function foo(userId) {
      return minq.from('users')
      .byId(userId)
      .select({country: 1})
      .one()
      .then(function (user) {
        return minq.from('countries')
          .byId(user.country)
          .one()
      })
    }

you could do:

    minq = rope()
      .stub({collection: 'users', data: {country: 12}})
      .stub({collection: 'countries', data: {name: 'Uganda'}})
      .minq()

    foo('user2').then(function (val) {
      val.should.deep.equal({name: 'Uganda'})

      minq.queries[0].query.should.deep.equal({_id: 'user2'})
      minq.queries[1].query.should.deep.equal({_id: 'user2'})
    })

Note that real `minq#byId` and `minq#byIds` coerce the values to BSON ObjectIds

This is likely to be refined in future versions.

## Bonus knowledge

Minks are of the family Mustelidae, which also includes the weasels, otters and ferrets.

You may also be interested in [how to put a harness on a tame mink](http://www.youtube.com/watch?v=fHbfzWQ4ksI)

## License
MIT. (c) 2013 jden <jason@denizac.org>. See LICENSE.md