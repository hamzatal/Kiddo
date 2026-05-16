# AI Auto-Segmentation Guide

## نظرة عامة

بدلاً من الاستماع يدوياً لكل ملف صوتي وتحديد بدايات ونهايات كل كلمة، يستخدم **Kiddo** الآن **OpenAI Whisper** لاستخراج توقيتات الكلمات تلقائياً ووضعها في `segment_start_ms` و `segment_end_ms` لكل كلمة في قاعدة البيانات.

يتوفر الـ Whisper الآن من ثلاث طرق:

| الطريقة | متى تستخدمها |
|---|---|
| 🖱️ زر **Auto-find this word** داخل محرر الـ segment | لكلمة واحدة، وانت تشتغل عليها |
| 🖱️ زر **✨ Auto-find all unset** أعلى صفحة Words & Segments | كل الكلمات في الصفحة الحالية اللي ما عندها بداية/نهاية |
| 🧑‍💻 أمر artisan `kiddo:auto-segment` | معالجة مجمعة من الـ terminal للـ workflow الأولي أو CI |

## كيف يعمل

1. يأخذ مسار صوتي (مثلاً `PB6`).
2. ينزّله من NCCD (أو يستخدم النسخة المحلية إن وجدت).
3. يرسله إلى Whisper API مع طلب توقيتات على مستوى الكلمة (`word-level timestamps`).
4. يطابق الكلمات المنطوقة بالكلمات الموجودة في قاعدة البيانات (المرتبطة بهذا التراك).
5. يحفظ بداية/نهاية كل كلمة بالميلي ثانية مع padding صغير (50ms قبل + 100ms بعد) لتشغيل أكثر طبيعية.

## الإعداد

في ملف `.env`:

```bash
OPENAI_API_KEY=sk-...
```

## ١) من واجهة الإدمن (الأسهل)

### كلمة واحدة

1. روح لـ **Admin → Words & Segments**.
2. تأكد إنه الكلمة مرتبطة بـ `audio_track_id` (من القائمة المنسدلة).
3. اضغط **Set segment** لفتح محرر الـ segment.
4. اضغط زر **✨ Auto-find this word** (في أعلى المحرر).
5. Whisper يحط البداية والنهاية. اضغط **Save segment**.
6. لو ما تطابقت الكلمة، استخدم الـ timeline يدوياً (سحب الـ handles أو أزرار ±0.1s/±1s).

### كل الكلمات في الصفحة

1. روح لـ **Admin → Words & Segments**.
2. اضغط **✨ Auto-find all unset** في رأس الصفحة.
3. شريط أرجواني يعرض التقدّم: `"Done 3/8 tracks · 2 matched"`.
4. لما يخلّص، الصفحة تعيد التحميل تلقائياً وتشوف البدايات والنهايات الجديدة.

> **ملاحظة:** الزر ذكي — يعمل de-duplication حسب `audio_track_id`. لو 8 كلمات مرتبطة بنفس الـ track، Whisper يشتغل مرة وحدة فقط (والكل يتعدّل دفعة وحدة) فما تهدر credit.

## ٢) من سطر الأوامر (للـ workflows الكبيرة)

### تراك واحد:

```bash
php artisan kiddo:auto-segment --track=PB6
```

### كل تراكات وحدة معينة:

```bash
php artisan kiddo:auto-segment --unit=2
```

### كل التراكات في النظام (موصى به للإعداد الأولي):

```bash
php artisan kiddo:auto-segment --all
```

### إعادة الحساب فوق التوقيتات الموجودة:

```bash
php artisan kiddo:auto-segment --all --overwrite
```

### عرض تفاصيل كل كلمة:

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
- 119 تراك × ~30 ثانية متوسط = ~60 دقيقة → **~$0.36 لمعالجة كل المنهج**.
- مرة واحدة فقط (التوقيتات تُحفظ بقاعدة البيانات).
- زر **Auto-find all unset** يعمل de-dup بالـ `audio_track_id` عشان لا يتم استدعاء Whisper مرتين على نفس التراك.

## ماذا يحدث للكلمات غير المتطابقة؟

- إذا لم يجد Whisper الكلمة (مثلاً صوت غير واضح أو الكلمة غير منطوقة في التراك)، تبقى التوقيتات `null` في القاعدة، وستلعب الكلمة التراك كاملاً.
- يمكن للأدمن تعديل هذه الكلمات يدوياً من محرر الـ segment الجديد:
  - **انقر على الـ timeline** للقفز لأي نقطة.
  - **اسحب الـ handles** الأخضر/البرتقالي مباشرة لضبط البداية/النهاية.
  - استخدم أزرار **±1s / ±0.1s** للتعديل الدقيق على البداية أو النهاية.
  - **Loop preview** checkbox لتكرار المقطع أثناء الاستماع.
- في المستقبل: ممكن إضافة fuzzy matching أكثر تقدماً (Levenshtein distance) لاكتشاف الأخطاء الإملائية الطفيفة.

## الـ workflow الموصى به

1. **مرة واحدة عند الإعداد الأولي:** شغّل `php artisan kiddo:auto-segment --all` من الـ terminal — الأسرع.
2. **أثناء الاستخدام اليومي:** كل ما تضيف كلمة جديدة وتربطها بـ track، اضغط **Auto-find this word** من المحرر مباشرة.
3. **لو تم تحسين Whisper أو غيّرت كلمة:** شغّل `--track=NEW_CODE --overwrite` أو استخدم زر الـ admin.

## الخصوصية

- Whisper يرسل الصوت إلى OpenAI ويعالجه ثم يحذفه (حسب OpenAI policy).
- لا يتم رفع أي بيانات شخصية للأطفال — فقط ملفات NCCD العامة.
- التوقيتات (أرقام فقط) تُخزن محلياً في قاعدة البيانات.

## Endpoints المتاحة

| Method | Path | الغرض |
|---|---|---|
| `POST` | `/admin/words/{word}/auto-segment` | Whisper لكلمة واحدة (يستدعى من زر **Auto-find this word**) |

الأمر الـ artisan `kiddo:auto-segment` يكشف نفس الخدمة `App\Services\AudioSegmentationService` لكن بدون HTTP layer.
