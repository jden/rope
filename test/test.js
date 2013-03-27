var chai = require('chai')
chai.should()

var rope = require('../index')

describe('rope', function () {
  it('is useful for mocking minq', function (done) {

    var spy = rope()
        .stub({
          collection: 'users',
          data: [
            {_id: 1, name: 'jason', email: 'jason@denizac.org'},
            {_id: 2, name: 'jason', email: 'jason@agilediagnosis.com'}
          ]
        })
        .minq()


    function methodUnderTest() {

      return spy
          .from('users')
          .select({name: 1, email:1})
          .where({name: 'jason'})
          .toArray()

    }


    methodUnderTest().then(function (val) {
      val.length.should.equal(2)
      spy.queries.length.should.equal(1)
      spy.readQueries.length.should.equal(1)
      spy.writeQueries.length.should.equal(0)
    }).then(done, done)


  })

})

describe('multiple queries', function () {
  it('dispatches based on collection', function (done) {

    var spy = rope()
    .stub({
      collection: 'foo',
      data: {
        _id: '123asd'
      }
    })
    .stub({
      collection: 'bar',
      data: {
        _id: '234ewq',
        val: 'baz'
      }
    }).minq()

    function method() {
      return spy.from('foo').one().then(function (aFoo) {
        aFoo._id.should.equal('123asd')
        return spy.from('bar').one()
      })
    }

    method().then(function (aBar){
      aBar.val.should.equal('baz')
      spy.queries.length.should.equal(2)
      spy.readQueries.length.should.equal(2)
      spy.writeQueries.length.should.equal(0)
    }).then(done, done)

  })
})

describe('query recording', function () {

  it('where', function (done) {
    var spy = rope()
      .stub({
        collection: 'foo',
        data: {_id: 5, name: 'bob', age: 14}
      })
      .minq()

    spy.from('boo').where({_id: 5, name: 'bob'}).one().then(function () {
      spy.queries[0].type.should.equal('one')
      spy.queries[0].query.should.deep.equal({_id: 5, name: 'bob'})
    }).then(done, done)
  })

  it('sort', function (done) {
    var spy = rope()
      .stub({data: {_id: 'foo' }})
      .minq()

    spy.from('blah')
      .sort({_id: 1})
      .one()
      .then(function () {
        spy.queries[0].options.sort.should.deep.equal({_id: 1})
      })
      .then(done, done)
  })
  it('skip', function (done) {
    var spy = rope()
      .stub({data: {_id: 'foo' }})
      .minq()

    spy.from('blah')
      .skip(1)
      .one()
      .then(function () {
        spy.queries[0].options.skip.should.deep.equal(1)
      })
      .then(done, done)
  })
  it('limit', function (done) {
    var spy = rope()
      .stub({data: {_id: 'foo' }})
      .minq()

    spy.from('blah')
      .limit(1)
      .one()
      .then(function () {
        spy.queries[0].options.limit.should.deep.equal(1)
      })
      .then(done, done)
  })
  it('byId', function (done) {
    var spy = rope()
      .stub({data: {_id: 'foo' }})
      .minq()

    spy.from('blah')
      .byId(1)
      .one()
      .then(function () {
        spy.queries[0].options.query.should.deep.equal({_id: 1})
      })
      .then(done, done)
  })
  it('byIds', function (done) {
    var spy = rope()
      .stub({data: {_id: 'foo' }})
      .minq()

    spy.from('blah')
      .byIds([1,2])
      .one()
      .then(function () {
        spy.queries[0].options.query.should.deep.equal({_id: {$in: [1,2]}})
      })
      .then(done, done)
  })
  it('expect', function (done) {
    var spy = rope()
      .stub({data: {_id: 'foo' }})
      .minq()

    spy.from('blah')
      .expect(1)
      .one()
      .then(function () {
        spy.queries[0].options.expect.should.deep.equal(1)
      })
      .then(done, done)
  })

})
