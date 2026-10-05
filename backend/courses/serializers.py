from django.utils.text import slugify
from rest_framework import serializers
from .models import Course, PaymentPlan, Session, Material, Note


class CamelCaseWriteMixin:
    """Accept the camelCase keys the mobile client sends.

    Requests are translated onto the model's snake_case fields before
    validation, so a serializer declares each field exactly once and there is
    no chance of a camelCase and snake_case value both being accepted and
    silently disagreeing.
    """

    CAMEL_ALIASES: dict[str, str] = {}

    def to_internal_value(self, data):
        if not isinstance(data, dict) or not any(camel in data for camel in self.CAMEL_ALIASES):
            return super().to_internal_value(data)
        # .copy() preserves the mapping type - a QueryDict must stay a QueryDict,
        # otherwise every uploaded value collapses into a list.
        mapped = data.copy()
        for camel, snake in self.CAMEL_ALIASES.items():
            if camel in mapped:
                mapped.setdefault(snake, mapped[camel])
                del mapped[camel]
        return super().to_internal_value(mapped)


class PaymentPlanSerializer(serializers.ModelSerializer):
    courseId = serializers.CharField(source='course_id', read_only=True)
    priceInr = serializers.IntegerField(source='price_inr', read_only=True)
    installmentAmountInr = serializers.IntegerField(source='installment_amount_inr', read_only=True)
    isPopular = serializers.BooleanField(source='is_popular', read_only=True)
    durationMonths = serializers.IntegerField(source='duration_months', read_only=True)
    planType = serializers.CharField(source='plan_type', read_only=True)
    duration = serializers.SerializerMethodField()

    class Meta:
        model = PaymentPlan
        fields = (
            'id', 'course', 'courseId', 'name', 'description',
            'price_inr', 'priceInr', 'currency', 'plan_type', 'planType',
            'duration_months', 'durationMonths', 'duration',
            'installments', 'installment_amount_inr', 'installmentAmountInr',
            'is_popular', 'isPopular', 'features'
        )

    def get_duration(self, obj):
        return f"{obj.duration_months} Month" + ("s" if obj.duration_months != 1 else "")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(data['id'])
        return data


class PaymentPlanWriteSerializer(CamelCaseWriteMixin, serializers.ModelSerializer):
    CAMEL_ALIASES = {
        'priceInr': 'price_inr',
        'installmentAmountInr': 'installment_amount_inr',
        'planType': 'plan_type',
        'durationMonths': 'duration_months',
        'isPopular': 'is_popular',
    }

    class Meta:
        model = PaymentPlan
        fields = (
            'name', 'description', 'price_inr', 'currency',
            'plan_type', 'duration_months', 'installments',
            'installment_amount_inr', 'is_popular', 'features',
        )
        extra_kwargs = {
            'description': {'required': False},
            'price_inr': {'required': False},
            'installment_amount_inr': {'required': False},
        }

    def validate(self, attrs):
        installments = attrs.get('installments') or getattr(self.instance, 'installments', 1) or 1
        price = attrs.get('price_inr') or getattr(self.instance, 'price_inr', 0)
        given = attrs.get('installment_amount_inr')
        if given is None and price and installments > 1:
            attrs['installment_amount_inr'] = price // installments
        return attrs


class SessionSerializer(serializers.ModelSerializer):
    courseId = serializers.CharField(source='course_id', read_only=True)
    scheduledAt = serializers.DateTimeField(source='start_time', read_only=True)
    durationMinutes = serializers.IntegerField(source='duration_minutes', read_only=True)
    instructorName = serializers.CharField(source='instructor_name', read_only=True)
    isCompleted = serializers.SerializerMethodField()
    recordingAvailable = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = (
            'id', 'course', 'courseId', 'title', 'description',
            'instructor_name', 'instructorName', 'start_time', 'scheduledAt',
            'duration_minutes', 'durationMinutes', 'platform',
            'status', 'isCompleted', 'recordingAvailable'
        )

    def get_isCompleted(self, obj):
        return obj.status == 'completed'

    def get_recordingAvailable(self, obj):
        return False

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(data['id'])
        return data


class SessionWriteSerializer(CamelCaseWriteMixin, serializers.ModelSerializer):
    CAMEL_ALIASES = {
        'scheduledAt': 'start_time',
        'durationMinutes': 'duration_minutes',
        'instructorName': 'instructor_name',
        'meetingId': 'meeting_id',
        'meetingUrl': 'meeting_url',
        'meetingPassword': 'passcode',
        'passcode': 'passcode',
    }

    class Meta:
        model = Session
        fields = (
            'title', 'description', 'instructor_name', 'start_time',
            'duration_minutes', 'platform', 'status',
            'meeting_id', 'meeting_url', 'passcode',
        )
        extra_kwargs = {
            'description': {'required': False},
            'instructor_name': {'required': False},
            'start_time': {'required': False},
            'duration_minutes': {'required': False},
            'meeting_url': {'required': False},
        }

    def validate(self, attrs):
        if not attrs.get('start_time') and self.instance is not None:
            attrs['start_time'] = self.instance.start_time
        if not attrs.get('start_time'):
            raise serializers.ValidationError({'scheduledAt': 'This field is required.'})
        if not attrs.get('instructor_name'):
            attrs['instructor_name'] = 'Learnova Faculty'
        return attrs


class MaterialSerializer(serializers.ModelSerializer):
    courseId = serializers.CharField(source='course_id', read_only=True)
    sizeBytes = serializers.IntegerField(source='file_size_bytes', read_only=True)
    isProtected = serializers.BooleanField(source='is_protected', read_only=True)
    uploadedAt = serializers.DateTimeField(source='created_at', read_only=True)
    allowDownload = serializers.BooleanField(source='allow_download', read_only=True)
    hasFile = serializers.SerializerMethodField()
    uploadedBy = serializers.CharField(source='created_by.email', read_only=True, default=None)

    class Meta:
        model = Material
        fields = (
            'id', 'course', 'courseId', 'title', 'type',
            'file_size_bytes', 'sizeBytes', 'is_protected', 'isProtected',
            'allow_download', 'allowDownload', 'hasFile', 'uploadedBy',
            'created_at', 'uploadedAt'
        )

    def get_hasFile(self, obj):
        return bool(obj.file or obj.file_url)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(data['id'])
        return data


class MaterialWriteSerializer(CamelCaseWriteMixin, serializers.ModelSerializer):
    CAMEL_ALIASES = {
        'fileUrl': 'file_url',
        'isProtected': 'is_protected',
        'allowDownload': 'allow_download',
        'sizeBytes': 'file_size_bytes',
    }

    file = serializers.FileField(required=False, allow_null=True)
    title = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Material
        fields = ('title', 'type', 'file', 'file_url', 'is_protected', 'allow_download')
        extra_kwargs = {
            'type': {'required': False},
            'file_url': {'required': False},
            'is_protected': {'required': False},
            'allow_download': {'required': False},
        }

    def validate(self, attrs):
        upload = attrs.get('file')
        title = attrs.get('title') or (upload.name if upload else '')
        if not title:
            raise serializers.ValidationError({'title': 'A title or file is required.'})
        attrs['title'] = title
        if upload:
            attrs['file_size_bytes'] = upload.size
        return attrs


class NoteSerializer(serializers.ModelSerializer):
    courseId = serializers.CharField(source='course_id', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    author = serializers.SerializerMethodField()
    authorName = serializers.CharField(source='author.name', read_only=True, default=None)
    hasAttachment = serializers.SerializerMethodField()

    class Meta:
        model = Note
        fields = (
            'id', 'course', 'courseId', 'title', 'content',
            'author', 'authorName', 'attachment_url', 'hasAttachment',
            'created_at', 'createdAt', 'updated_at', 'updatedAt',
        )

    def get_author(self, obj):
        if not obj.author_id:
            return None
        return {
            'id': str(obj.author_id),
            'name': obj.author.name or obj.author.email,
            'email': obj.author.email,
            'role': obj.author.role,
        }

    def get_hasAttachment(self, obj):
        return bool(obj.attachment_url)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(data['id'])
        return data


class NoteWriteSerializer(CamelCaseWriteMixin, serializers.ModelSerializer):
    CAMEL_ALIASES = {'attachmentUrl': 'attachment_url'}

    class Meta:
        model = Note
        fields = ('title', 'content', 'attachment_url')
        extra_kwargs = {'attachment_url': {'required': False}}


class CourseListSerializer(serializers.ModelSerializer):
    payment_plans = PaymentPlanSerializer(many=True, read_only=True)
    paymentPlans = serializers.SerializerMethodField()
    thumbnail = serializers.CharField(source='thumbnail_url', read_only=True)
    instructor = serializers.SerializerMethodField()
    ratingCount = serializers.IntegerField(source='total_reviews', read_only=True)
    enrolledCount = serializers.IntegerField(source='total_enrolled', read_only=True)
    durationWeeks = serializers.SerializerMethodField()
    totalSessions = serializers.IntegerField(source='total_sessions', read_only=True)
    shortDescription = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = Course
        fields = (
            'id', 'title', 'slug', 'description', 'shortDescription', 'category', 'level',
            'instructor_name', 'instructor_avatar', 'instructor', 'thumbnail_url', 'thumbnail',
            'price_inr', 'rating', 'total_reviews', 'ratingCount', 'total_enrolled', 'enrolledCount',
            'duration_hours', 'durationWeeks', 'total_sessions', 'totalSessions', 'tags',
            'payment_plans', 'paymentPlans', 'created_at', 'createdAt', 'updated_at', 'updatedAt'
        )

    def get_paymentPlans(self, obj):
        # Avoid re-serialising the related manager twice per course.
        return PaymentPlanSerializer(obj.payment_plans.all(), many=True).data

    def get_instructor(self, obj):
        """Only real, persisted data. No placeholder ids or bios."""
        return {
            'name': obj.instructor_name,
            'avatar': obj.instructor_avatar or '',
        }

    def get_durationWeeks(self, obj):
        return max(1, round((obj.duration_hours or 40) / 10))

    def get_shortDescription(self, obj):
        return (obj.description or '')[:140]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['id'] = str(data['id'])
        return data


class CourseDetailSerializer(CourseListSerializer):
    """Catalogue detail. Protected content is added by
    CourseDetailProtectedView only when access is granted."""

    class Meta(CourseListSerializer.Meta):
        fields = CourseListSerializer.Meta.fields + ('is_published',)


class CourseWriteSerializer(CamelCaseWriteMixin, serializers.ModelSerializer):
    CAMEL_ALIASES = {
        'instructorName': 'instructor_name',
        'instructorAvatar': 'instructor_avatar',
        'thumbnailUrl': 'thumbnail_url',
        'thumbnail': 'thumbnail_url',
        'priceInr': 'price_inr',
        'durationHours': 'duration_hours',
        'totalSessions': 'total_sessions',
        'isPublished': 'is_published',
    }

    slug = serializers.SlugField(required=False, allow_blank=True)
    instructor_name = serializers.CharField(required=False, allow_blank=True)
    thumbnail_url = serializers.CharField(required=False, allow_blank=True)
    price_inr = serializers.IntegerField(required=False, min_value=0)
    duration_hours = serializers.IntegerField(required=False, min_value=0)
    total_sessions = serializers.IntegerField(required=False, min_value=0)

    class Meta:
        model = Course
        fields = (
            'title', 'slug', 'description', 'category', 'level',
            'instructor_name', 'instructor_avatar', 'thumbnail_url',
            'price_inr', 'duration_hours', 'total_sessions',
            'tags', 'is_published',
        )
        extra_kwargs = {
            f: {'required': False} for f in (
                'title', 'description', 'category', 'level', 'instructor_avatar',
                'thumbnail_url', 'price_inr', 'duration_hours', 'total_sessions',
                'tags', 'is_published',
            )
        }

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if not attrs.get('instructor_name'):
            attrs['instructor_name'] = 'Learnova Faculty'
        return attrs

    def validate_slug(self, value):
        qs = Course.objects.filter(slug=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('This slug is already in use.')
        return value

    def _with_slug(self, attrs):
        if attrs.get('slug') or not attrs.get('title'):
            return attrs
        base = (slugify(attrs['title']) or 'course')[:240]
        candidate, counter = base, 2
        while Course.objects.filter(slug=candidate).exists():
            candidate = f"{base}-{counter}"
            counter += 1
        attrs['slug'] = candidate
        return attrs

    def create(self, validated_data):
        attrs = self._with_slug(validated_data)
        if not attrs.get('slug'):
            raise serializers.ValidationError({'slug': 'Could not derive a slug from the title.'})
        return super().create(attrs)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)