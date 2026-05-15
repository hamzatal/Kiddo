# AI Auto-Segmentation Guide

## نظرة عامة

بدلاً من الاضطرار إلى الاستماع يدويًا لكل ملف صوتي وتحديد بدايات ونهايات كل كلمة، يوجد الآن أمر artisan يستخدم **OpenAI Whisper** لاستخراج توقيتات الكلمات تلقائياً ووضعها في `segment_start_ms` و `segment_end_ms` لكل كلمة في قاعدة البيانات.

## كيف يعمل

1. يأخذ مسار صوتي (مثلاً `PB6`)
2. ينزّله من NCCD (أو يستخدم النسخة المحلية إن وجدت)
3. يرسله إلى Whisper API مع طلب توقيتات على مستوى الكلمة (`word-level timestamps`)
4. يطابق الكلمات المنطوقة بالكلمات الموجودة في قاعدة البيانات (مرتبطة بهذا التراك)
5. يحفظ بداية/نهاية كل كلمة بالميلي ثانية مع padding صغير (50ms قبل + 100ms بعد) لتشغيل أكثر طبيعية

## الإعداد

في ملف `.env`:

```bash
OPENAI_API_KEY=sk-...
```

## الاستخدام

### 1. معالجة تراك واحد:

```bash
php artisan kiddo:auto-segment --track=PB6
```

### 2. معالجة كل تراكات وحدة معينة:

```bash
php artisan kiddo:auto-segment --unit=2
```

### 3. معالجة كل التراكات في النظام (موصى به للإعداد الأولي):

```bash
php artisan kiddo:auto-segment --all
```

### 4. الكتابة فوق التوقيتات الموجودة:

```bash
php artisan kiddo:auto-segment --all --overwrite
```

### 5. عرض تفاصيل كل كلمة:

```bash
php artisan kiddo:auto-segment --track=PB6 -v
```

## مثال على الإخراج

```
Processing 3 track(s)

→ Track PB6: Boy, brother, cat, dad
  ✓ Matched 4/4 words

→ Track PB10: Mum, sister, friend
  ✓ Matched 3/3 words

→ Track PB12: Hello, hi, goodbye
  ✓ Matched 2/3 words

Done! Total: 9/10 words segmented.
```

## التكلفة

Whisper API تكلف **$0.006 per minute** من الصوت.
- 119 تراك × ~30 ثانية متوسط = ~60 دقيقة → **~$0.36 لمعالجة كل المنهج**
- مرة واحدة فقط (التوقيتات تُحفظ بقاعدة البيانات)

## ماذا يحدث للكلمات غير المتطابقة؟

- إذا لم يجد Whisper الكلمة (مثلاً صوت غير واضح أو الكلمة غير منطوقة في التراك)، تبقى التوقيتات `null` في القاعدة وستلعب الكلمة التراك كاملاً
- يمكن للأدمن تعديل هذه الكلمات يدويًا من صفحة Words & Segments
- في المستقبل: ممكن إضافة fuzzy matching أكثر تقدماً (Levenshtein distance) لاكتشاف الأخطاء الإملائية الطفيفة

## نصيحة للـ workflow

1. **مرة واحدة عند الإعداد**: شغّل `php artisan kiddo:auto-segment --all`
2. **عند إضافة كلمات/تراكات جديدة**: شغّل `--track=NEW_CODE`  
3. **إذا تم تحسين النموذج**: شغّل `--all --overwrite` لإعادة الحساب

## الخصوصية

- Whisper يرسل الصوت إلى OpenAI ويعالجه ثم يحذفه (حسب OpenAI policy)
- لا يتم رفع أي بيانات شخصية للأطفال
- التوقيتات (أرقام فقط) تُخزن محلياً في قاعدة البيانات
