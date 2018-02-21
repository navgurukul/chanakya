gcloud compute ssh saral-app-1 --zone=asia-southeast1-a # ssh into the sever
sudo su rishmunk # deployment happens thur this username
cd /home/rishmunk/chanakya # directory of code
git pull # pull the code
export CHANAKYA_ENV=../config/production.py
source venv/bin/activate
export LC_ALL=C.UTF-8 # chutiyaap
export LANG=C.UTF-8 # chutiyaap
export FLASK_APP=chanakya.py
flask db upgrade
sudo supervisorctl restart all