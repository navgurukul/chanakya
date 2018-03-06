class processing_html():
    before = '''
<h1 class="col-xs-12 col-sm-12">
Iss test me aapko jaldi jaldi uttar dena hai.
</h1>
<h2 class="col-xs-12 col-sm-12">
Koshish karo sahi uttar jyada se jyada ho!
</h2>
'''

class memory_html():
    before = '''
    <div class="col-xs-12 col-sm-12">
Niche di gyi image ko dhyaan se dekho aur isska ache se ratta maarlo. - <b>1 Marks</b><br/>
<img src="https://image.ibb.co/bNUTQx/19M.png" class="img img-responsive">
<br/>
Niche di gyi image me dhyaan se dekho kaun kaun se alphabets hai! - <b>2 Marks</b><br/>
<img src="https://image.ibb.co/cRqPyH/20M.png" class="img img-responsive">
<br/>
Niche di gyi image me dhyaan se dekho kaun kaun se color kis kis shabd se likhe hai. <b>3 Marks</b><br/>
<img src="https://image.ibb.co/iUGxJH/21M.png" class="img img-responsive">
</div>
<style>
    .img{
        min-width:360px;
    }
</style>
'''

class mix_MCQ_html():
    before = '''
<h1 class="col-xs-12 col-sm-12">
Aapse agle test me kuch questions pooche jaenge, apna uttar aram se soch samajh k de.
</h1>
<h1 class="col-xs-12 col-sm-12">
aapko next 18 questions, 18 minutes me karne hai
</h1>
<h2 class="col-xs-12 col-sm-12">Par time ka bhi khyaal rakhe!</h2>
'''

class generic_html():
    after = '''
<h1 class="col-xs-12 col-sm-12">Aapne apna Test submit nahi kiya!</h1>
<h2 class="col-xs-12 col-sm-12">Koi baat nahi thori der me apne aap ye test submit ho jaega</h2>
'''

generic    = generic_html()
mix_mcqs   = mix_MCQ_html()
memory     = memory_html()
processing = processing_html()
