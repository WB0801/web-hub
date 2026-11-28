# Build fixed, gender-specific neural umpire banks using Kokoro-82M (Apache-2.0).
# Output assets are static audio; the browser never downloads model weights.
import json, sys, wave
from pathlib import Path
import numpy as np
import torch
from kokoro import KPipeline, KModel
out=Path(sys.argv[1] if len(sys.argv)>1 else 'shuttle-dynasty/referee/neural-v1'); out.mkdir(parents=True,exist_ok=True)
torch.set_num_threads(2)
EN=['love','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty','twenty-one']
ZH=['零','一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','二十一']
PH={'en':{'all':'all','service':'service over','gamepoint':'game point','matchpoint':'match point','play':'play','interval':'interval, change ends','second':'second game','final':'final game','game':'game','match':'match finished'},'zh':{'all':'平','ratio':'比','service':'交换发球权','gamepoint':'局点','matchpoint':'赛点','play':'开始比赛','interval':'休息，交换场地','second':'第二局','final':'决胜局','game':'本局结束','match':'比赛结束'}}

rate=24000
model=KModel(repo_id='hexgrad/Kokoro-82M').to('cpu').eval()
for lang,nums,lang_code,voices in [('en',EN,'a',{'female':'af_heart','male':'am_michael'}),('zh',ZH,'z',{'female':'zf_xiaobei','male':'zm_yunjian'})]:
    pipeline=KPipeline(lang_code=lang_code,repo_id='hexgrad/Kokoro-82M',model=model,device='cpu')
    for gender,voice in voices.items():
        asset=lang+'-'+gender; clips={**{str(i):s for i,s in enumerate(nums)},**PH[lang]}; index={}; pcm=[]; offset=0
        for key,phrase in clips.items():
            chunks=[np.asarray(a,dtype=np.float32).reshape(-1) for _,_,a in pipeline(phrase,voice=voice,speed=1.04) if a is not None]
            if not chunks: raise RuntimeError('no audio: '+asset+' '+key)
            samples=np.concatenate(chunks); active=np.flatnonzero(np.abs(samples)>.008)
            if not len(active): raise RuntimeError('silent: '+asset+' '+key)
            samples=samples[max(0,active[0]-int(rate*.025)):min(len(samples),active[-1]+int(rate*.05)+1)].copy()
            ramp=min(int(rate*.008),len(samples)//2)
            if ramp: samples[:ramp]*=np.linspace(0,1,ramp); samples[-ramp:]*=np.linspace(1,0,ramp)
            peak=float(np.max(np.abs(samples))); samples*=min(2.5,.80/max(.001,peak))
            clip=(np.clip(samples,-1,1)*32767).astype('<i2'); index[key]=[offset/rate,len(clip)/rate]
            pcm.extend([clip,np.zeros(int(rate*.025),dtype='<i2')]);offset+=len(clip)+int(rate*.025)
        assert len(index)==len(clips)
        with wave.open(str(out/(asset+'.wav')),'wb') as w:
            w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(np.concatenate(pcm).tobytes())
        (out/(asset+'.json')).write_text(json.dumps({'engine':'Kokoro-82M','voice':voice,'asset':asset,'clips':index},separators=(',',':')),encoding='utf-8')
        print(asset,voice,len(index),round(offset/rate,2),flush=True)
(out/'ATTRIBUTION.txt').write_text('Speech synthesized with hexgrad/Kokoro-82M, Apache License 2.0. Model: https://huggingface.co/hexgrad/Kokoro-82M . License: https://www.apache.org/licenses/LICENSE-2.0 . Fixed voices: af_heart, am_michael, zf_xiaobei, zm_yunjian.\n',encoding='utf-8')
