var chai = require('chai')
chai.should()
var ObjectId = require('objectid')

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

  it('dispatches based on where', function (done) {

    var spy = rope()
    .stub({
      data: {
        _id: '123asd',
        val: 'foo'
      }
    })
    .stub({
      data: {
        _id: '234ewq',
        val: 'baz'
      }
    }).minq()

    function method () {
      return spy.from('foo').byId('123asd').one().then(function (match) {
        match.val.should.equal('foo')
        return spy.from('foo').byId('234ewq').one().then(function (match) {
          match.val.should.equal('baz')
        })
      })
    }

    method().then(function (){
      spy.queries.length.should.equal(2)
      spy.readQueries.length.should.equal(2)
      spy.writeQueries.length.should.equal(0)
    }).then(done, done)

  })

  it('dispatches data if no collection is specified', function (done) {
    var spy = rope().stub({data: {foo: 'baz'}}).minq()
    spy.from('foos').one().then(function (foo) {
      foo.should.deep.equal({foo: 'baz'})
    }).then(done, done)
  })
})

describe('minq syntax', function () {
  it('db constructor', function (done) {
    var spy = rope().minq()
    var db = {}
    spy(db).from('blah').one().then(function () {
      spy.queries[0].db.should.equal(db)
    }).then(done, done)
  })
  it('collection', function (done) {
    var spy = rope().minq()

    spy
    .from('foo')
    .one()
    .then(function (aFoo) {
      spy.queries[0].collection.should.equal('foo')
    }).then(done, done)
  })

  it('one', function (done) {

    var spy = rope().minq()

    spy.collection('foo')
    .one()
    .then(function () {
      spy.queries[0].type.should.equal('one')
      spy.queries.length.should.equal(1)
      spy.readQueries.length.should.equal(1)
    }).then(done, done)

  })

  it('deferOne', function (done) {

    var spy = rope().minq()

    var one = spy.collection('foo')
    .deferOne()

    one.should.be.a('function')

    one().then(function () {
      spy.queries[0].type.should.equal('one')
      spy.queries.length.should.equal(1)
      spy.readQueries.length.should.equal(1)
    }).then(done, done)

  })


  it('toArray', function (done) {

    var spy = rope().minq()

    spy.collection('foo')
    .toArray()
    .then(function () {
      spy.queries[0].type.should.equal('toArray')
      spy.queries.length.should.equal(1)
      spy.readQueries.length.should.equal(1)
    }).then(done, done)

  })

  it('deferToArray', function (done) {

    var spy = rope().minq()

    var array = spy.collection('foo')
    .deferToArray()

    array.should.be.a('function')

    array().then(function () {
      spy.queries[0].type.should.equal('toArray')
      spy.queries.length.should.equal(1)
      spy.readQueries.length.should.equal(1)
    }).then(done, done)

  })

  it('insert', function (done) {
    var spy = rope().minq()

    spy.collection('foo')
    .insert({blah: 2})
    .then(function () {
      spy.queries[0].type.should.equal('insert')
      spy.queries.length.should.equal(1)
      spy.writeQueries.length.should.equal(1)
      spy.queries[0].changes.should.deep.equal({blah: 2})
      spy.writeQueries[0].changes.should.deep.equal({blah: 2})

    }).then(done, done)

  })

  it('update', function (done) {
    var spy = rope().minq()

    spy.collection('bar')
    .byId('boop')
    .update({$set: {name: 'baz'}})
    .then(function () {
      spy.queries[0].type.should.equal('update')
      spy.queries.length.should.equal(1)
      spy.writeQueries.length.should.equal(1)
      spy.queries[0].changes.should.deep.equal({$set: {name: 'baz'}})
      spy.writeQueries[0].should.equal(spy.queries[0])

    }).then(done, done)
  })

  it('upsert', function (done) {
    var spy = rope().minq()

    spy.collection('bar')
    .upsert({_id: 12, name: 'baz'})
    .then(function () {
      spy.queries[0].type.should.equal('upsert')
      spy.queries.length.should.equal(1)
      spy.writeQueries.length.should.equal(1)
      spy.queries[0].changes.should.deep.equal({_id: 12, name: 'baz'})
      spy.writeQueries[0].changes.should.deep.equal({_id: 12, name: 'baz'})

    }).then(done, done)
  })

  it('findAndModify', function (done) {
    var spy = rope().minq()

    spy.collection('bar')
    .where({foo: 'baz'})
    .findAndModify({$set: {foo: 'qux'}})
    .then(function () {
      spy.queries[0].type.should.equal('findAndModify')
      spy.queries.length.should.equal(1)
      spy.writeQueries.length.should.equal(1)
      spy.queries[0].changes.should.deep.equal({$set: {foo: 'qux'}})
      spy.writeQueries[0].should.equal(spy.queries[0])

    }).then(done, done)
  })

  it('modifyAndFind', function (done) {
    var spy = rope().minq()

    spy.collection('bar')
    .where({foo: 'baz'})
    .modifyAndFind({$set: {foo: 'qux'}})
    .then(function () {
      spy.queries[0].type.should.equal('modifyAndFind')
      spy.queries.length.should.equal(1)
      spy.writeQueries.length.should.equal(1)
      spy.queries[0].changes.should.deep.equal({$set: {foo: 'qux'}})
      spy.writeQueries[0].should.equal(spy.queries[0])

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
        spy.queries[0].query.should.deep.equal({_id: 1})
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
        spy.queries[0].query.should.deep.equal({_id: {$in: [1,2]}})
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
        spy.queries[0].options.expect.should.equal(1)
      })
      .then(done, done)
  })
  it('expect default', function (done) {
    var spy = rope()
      .stub({data: {_id: 'foo' }})
      .minq()

    spy.from('blah')
      .expect()
      .one()
      .then(function () {
        spy.queries[0].options.expect.should.equal(1)
      })
      .then(done, done)
  })
  it('select', function (done) {
    var spy = rope()
      .stub({data: {_id: 'foo' }})
      .minq()

    spy.from('blah')
      .select({all: 1})
      .one()
      .then(function () {
        spy.queries[0].options.select.should.deep.equal({all: 1})
      })
      .then(done, done)
  })


})

describe('$oid', function () {
  it('generates ObjectIds', function () {
    var oid = rope.$oid()
    ObjectId.isValid(oid).should.equal(true)
  })
  it('caches them to retreive later', function () {
    var id1 = rope.$oid('id1')
    id1.should.equal(rope.$oid('id1'))
  })
})