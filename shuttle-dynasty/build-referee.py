# Generate original synthetic fallback umpire phrases; no downloaded voice recordings.
import array, json, subprocess, tempfile, wave, sys
from pathlib import Path
out=Path(sys.argv[1] if len(sys.argv)>1 else 'shuttle-dynasty/referee'); out.mkdir(parents=True,exist_ok=True)
EN=['love','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty','twenty-one']
ZH=['零','一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','二十一']
PH={'en':{'all':'all','service':'service over','gamepoint':'game point','matchpoint':'match point','play':'play','interval':'interval, change ends','second':'second game','final':'final game','game':'game','match':'match finished'},'zh':{'all':'平','ratio':'比','service':'交换发球权','gamepoint':'局点','matchpoint':'赛点','play':'开始比赛','interval':'休息，交换场地','second':'第二局','final':'决胜局','game':'本局结束','match':'比赛结束'}}
for lang,nums,voice in [('en',EN,'en-gb'),('zh',ZH,'zh')]:
    clips={**{str(i):s for i,s in enumerate(nums)},**PH[lang]}; index={}; pcm=array.array('h'); rate=22050
    with tempfile.TemporaryDirectory() as td:
        for key,phrase in clips.items():
            p=Path(td)/'clip.wav'; subprocess.run(['espeak','-v',voice,'-s','155' if lang=='en' else '145','-a','140','-w',str(p),phrase],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
            with wave.open(str(p),'rb') as w:
                assert w.getframerate()==rate and w.getnchannels()==1 and w.getsampwidth()==2
                samples=array.array('h',w.readframes(w.getnframes()))
            active=[i for i,v in enumerate(samples) if abs(v)>150]; assert active,phrase
            lo=max(0,active[0]-int(rate*.025)); hi=min(len(samples),active[-1]+int(rate*.065)+1); samples=samples[lo:hi]
            index[key]=[len(pcm)/rate,len(samples)/rate]; pcm.extend(samples);pcm.extend([0]*int(rate*.035))
    with wave.open(str(out/(lang+'.wav')),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(pcm.tobytes())
    (out/(lang+'.json')).write_text(json.dumps(index,separators=(',',':')),encoding='utf-8')
    print(lang,len(index),round(len(pcm)/rate,2),len(pcm)*2)
