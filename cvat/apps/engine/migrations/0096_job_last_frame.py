# Generated migration for job progress tracking feature
# Job.last_frame 필드 추가: Save 시점의 프레임 번호를 저장하여 진행율 계산에 사용

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        # 직전 마이그레이션 의존
        ('engine', '0095_fix_related_names'),
    ]

    operations = [
        migrations.AddField(
            model_name='job',
            name='last_frame',
            # null=True: 기존 Job 및 아직 한 번도 Save하지 않은 Job은 null 유지
            field=models.PositiveIntegerField(blank=True, default=None, null=True),
        ),
    ]
