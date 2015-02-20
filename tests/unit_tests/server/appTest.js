/**
 * Created by xiazhang on 2/3/15.
 */

var request = require('supertest'),
    should = require('should');

var db = require('./../../dbSetup'),
    app = require('../../../app.js');

describe('App Routes testing', function() {

    before(function(done){
        // set up test mongodb
        db.dbconnect(app, function() {
            done();
        });
    });

    //beforeEach(function(done) {
    //    done();
    //});

    describe('GET /', function() {
        it('redirect to all', function(done) {
            request(app).get('/').expect(302, done);
        });
    });

    describe('GET /api/dossiers/', function() {

        it('should get dossiers', function(done){
            request(app).get('/api/dossiers/').expect(200).expect('Content-Type', /json/).end(function(err, res){


                should.not.exist(err);
                should.exist(res);

                res.body.should.be.instanceof(Array);

                if(err) {
                    done(err);
                } else {
                    done();
                }
            });
        });

    });

    //describe('GET /api/dossiers/:dossierid', function() {
    //    it('should get dossier info', function(done) {
    //        request(app).get('/api/dossiers/54821f8acab075de0b467de1').expect(200).end(function(err, res){
    //            should.not.exist(err);
    //
    //            res.body.should.be.an.instanceOf(Object)
    //                .and.have.property('id').eql('54821f8acab075de0b467de1');
    //
    //            done();
    //        })
    //    })
    //});

});

