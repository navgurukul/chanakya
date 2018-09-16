from chanakya.src.models import Questions
from chanakya.src import app

from flask import render_template
from subprocess import Popen, PIPE, STDOUT
import os


def render_pdf_phantomjs(template_name , **kwargs):
    """mimerender helper to render a PDF from HTML using phantomjs."""
    # The 'makepdf.js' PhantomJS program takes HTML via stdin and returns PDF binary via stdout
    html = render_template(template_name, **kwargs)
    p = Popen(['phantomjs', '%s/scripts/pdf.js' % os.path.dirname(os.path.realpath(__file__))], stdout=PIPE, stdin=PIPE, stderr=STDOUT)
    some = p.communicate(input=html.encode('utf-8'))[0]
    return some
