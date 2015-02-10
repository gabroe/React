/**
 * Created by xiazhang on 2/4/15.
 */

var should = require('should'),
    request = require('supertest'),
    express = require('express'),
    data = require('../../../../routes/data'),
    db = require('../../../dbSetup');

var app = express(),
    token;

app.use('/data', data);

describe('Route data test', function() {

    before(function(done) {
        // set up mongo db connection before testing
        db.dbconnect(app, function() {
            done();
        });
    });

    describe('Get token', function() {
        it('should get a token', function(done){
            request(app).get('/data/postgres/getToken').expect(200).end(function(err, res) {
                should.not.exist(err);
                res.body.data.should.have.property('connection-token');
                token = res.body.data['connection-token'];
                done();
            });

        });
    });

    describe('Get data', function() {
        it('token should not be empty', function(){
            should(token).not.be.empty;
        });
    });
});