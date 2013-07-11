var request = require('supertest');
var sinon = require('sinon');
var should = require('should');
var url = require('url');

var utils = require('./utils');
var examples = require('../').examples;

describe('Website', function() {
  var app = utils.buildApp();

  it('should return 200 OK with HTML at /', function(done) {
    request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(200, done);
  });

  describe('on POST to /', function() {

    it('should render index.html', function(done) {
      sinon.spy(app, "render");
      request(app)
        .post('/')
        .expect('Content-Type', /html/)
        .expect(200, function() {
          app.render.calledOnce.should.be.true;
          app.render.calledWith('index.html').should.be.true;
          app.render.restore();
          done();
        });
    });

    describe('with good assertion', function() {
      function goodString(post) {
        var host = url.parse(post.url).host;
        return JSON.stringify(examples.validAssertion(host));
      }

      it('should render index.html with info', function(done) {
        sinon.spy(app, "render");

        var post = request(app).post('/');
        post.send({ assertion: goodString(post) })
          .expect(200, function(err, res) {
            app.render.calledOnce.should.be.true;
            app.render.firstCall.args[0].should.equal('index.html');
            app.render.firstCall.args[1].should.have.property('valid', true);
            app.render.firstCall.args[1].should.have.property('response');
            app.render.firstCall.args[1].response.should.have.property('status', 'valid');
            app.render.firstCall.args[1].response.should.have.property('info');
            app.render.restore();
            done();
          });
      });
    });

    describe('with bad assertion', function() {
      var badString = JSON.stringify(examples.validAssertion('NOPESORRY'));

      it('should render index.html with error', function(done) {
        sinon.spy(app, "render");
        request(app)
          .post('/')
          .send({ assertion: badString })
          .expect(200, function(err, res) {
            app.render.calledOnce.should.be.true;
            app.render.firstCall.args[0].should.equal('index.html');
            app.render.firstCall.args[1].should.have.property('valid', false);
            app.render.firstCall.args[1].should.have.property('response');
            app.render.firstCall.args[1].response.should.have.property('status', 'invalid');
            app.render.firstCall.args[1].response.should.have.property('error');
            app.render.firstCall.args[1].response.should.have.property('reason');
            app.render.restore();
            done();
          });
      });
    });
  });

  describe('on XHR POST to /', function() {

    describe ('with HTML accept header', function() {

      it('should render response.html', function(done) {
        sinon.spy(app, "render");
        request(app)
          .post('/')
          .set('X-Requested-With', 'XMLHttpRequest')
          .set('Accept', 'text/html')
          .expect('Content-Type', /html/)
          .expect(200, function(err, res){
            app.render.calledOnce.should.be.true;
            app.render.calledWith('response.html').should.be.true;
            app.render.restore();
            done();
          });
      });

    });

    describe('with JSON accept header', function() {

      it('should always return 200 OK with JSON', function(done) {
        request(app)
          .post('/')
          .set('X-Requested-With', 'XMLHttpRequest')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200, done);
      });

      describe('with good assertion', function() {
        function goodString(post) {
          var host = url.parse(post.url).host;
          return JSON.stringify(examples.validAssertion(host));
        }

        it('should have valid status and info', function(done) {
          var post = request(app)
            .post('/');
          post
            .set('X-Requested-With', 'XMLHttpRequest')
            .set('Accept', 'application/json')
            .send({ assertion: goodString(post) })
            .expect(200, function(err, res) {
              res.body.status.should.equal('valid');  
              res.body.should.have.property('info');
              res.body.should.not.have.property('error');
              done();
            });
        });
      });

      describe('with bad assertion', function() {
        var badString = JSON.stringify(examples.validAssertion('NOPESORRY'));

        it('should have invalid status, reason, and error', function(done) {
          request(app)
            .post('/')
            .set('X-Requested-With', 'XMLHttpRequest')
            .set('Accept', 'application/json')
            .send({ assertion: badString })
            .expect(200, function(err, res) {
              res.body.status.should.equal('invalid');  
              res.body.should.have.property('reason');
              res.body.should.have.property('error');
              done();
            });
        });
      });
    });
  });
});