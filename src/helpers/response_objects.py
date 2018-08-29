from flask_restplus import fields
from chanakya.src import api

enrollment_key_status = api.model('EnrollmentKeyStatus', {
    'success': fields.Boolean,
    'enrollment_key_status':fields.String
})

enrollment_key_validation = api.model('EnrollmentKeyValidtion',{
    'valid': fields.Boolean,
    'reason': fields.String
})
