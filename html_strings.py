class set_1_class():
    before = '''
<h1 class="col-xs-12 col-sm-12"> I Come before the questions of Set 1 Starts</h1>
<h2 class="col-xs-12 border border-info">And I support Bootstrap</h2>
<p  class="col-xs-12 col-sm-12"> I am configured to run for 50 sec </p>
<br/>
<button class="show-off btn btn-md btn-danger"> I support JS/Jquery also </button>
<b class="show-style">And Custom CSS</b>
<br/>
<hr/>
<script>
    $(function(){
        $(".show-off").click(function(){
            alert("yo!");
        });
    });
</script>
<style>
    .show-style{
        font-size:2rem;
        text-shadow: 3px 3px red, 4px 5px green, 6px 6px 10px orange;
        color:skyblue;
    }
</style>
'''
    after = '''
<h1 class="col-xs-12 col-sm-12"> I Come after the questions of Set 1(if not submitted)</h1>
<h2 class="col-xs-12 border border-info">And I support Bootstrap</h2>
<p  class="col-xs-12 col-sm-12"> I am configured to run for 30 sec </p>
<br/>
<button class="show-off btn btn-md btn-danger"> I support JS/Jquery also </button>
<b class="show-style">And Custom CSS</b>
<br/>
<hr/>
<script>
    $(function(){
        $(".show-off").click(function(){
            alert("yo!");
        });
    });
</script>
<style>
    .show-style{
        font-size:2rem;
        text-shadow: 3px 3px red, 4px 5px green, 6px 6px 10px orange;
        color:skyblue;
    }
</style>
'''

class set_2_class():
    before = '''
<h1 class="col-xs-12 col-sm-12"> I Come before the questions of Set 2 Starts</h1>
<h2 class="col-xs-12 border border-info">And I support Bootstrap</h2>
<p  class="col-xs-12 col-sm-12"> I am configured to run for 45 sec </p>
<br/>
<button class="show-off btn btn-md btn-danger"> I support JS/Jquery also </button>
<b class="show-style">And Custom CSS</b>
<br/>
<hr/>
<script>
    $(function(){
        $(".show-off").click(function(){
            alert("yo!");
        });
    });
</script>
<style>
    .show-style{
        font-size:2rem;
        text-shadow: 3px 3px red, 4px 5px green, 6px 6px 10px orange;
        color:skyblue;
    }
</style>
'''
    after = '''
<h1 class="col-xs-12 col-sm-12"> I Come after the questions of Set 2(if not submitted)</h1>
<h2 class="col-xs-12 border border-info">And I support Bootstrap</h2>
<p  class="col-xs-12 col-sm-12"> I am configured to run for 30 sec </p>
<br/>
<button class="show-off btn btn-md btn-danger"> I support JS/Jquery also </button>
<b class="show-style">And Custom CSS</b>
<br/>
<hr/>
<script>
    $(function(){
        $(".show-off").click(function(){
            alert("yo!");
        });
    });
</script>
<style>
    .show-style{
        font-size:2rem;
        text-shadow: 3px 3px red, 4px 5px green, 6px 6px 10px orange;
        color:skyblue;
    }
</style>
'''

set_1 = set_1_class()
set_2 = set_2_class()
