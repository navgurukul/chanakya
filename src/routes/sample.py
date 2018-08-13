from flask_restplus import Resource

from chanakya.src import api

@api.route('/hello')
class SampleRoute1(Resource):
    @api.param(name="Whatever Hw", description="This is a test description.")
    def get(self):
        return {'data': 'here is some data'}
    def post(self):
        return {'data': 'here is some data from the post request'}

@api.route('/hello2')
@api.param(name="Whatever Hw", description="This is a test description.")
class SampleRoute2(Resource):

    def get(self):
        return {'data': 'here is some *more* data'}
