from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='InternalMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('recipient_type', models.CharField(choices=[('user', 'User'), ('department', 'Department'), ('position', 'Position'), ('all', 'All')], default='user', max_length=20, verbose_name='Recipient type')),
                ('title', models.CharField(max_length=200, verbose_name='Message title')),
                ('text', models.TextField(verbose_name='Message')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('recipient_department', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='department_messages', to='api.department', verbose_name='Recipient department')),
                ('recipient_position', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='position_messages', to='api.position', verbose_name='Recipient position')),
                ('recipient_user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='addressed_messages', to=settings.AUTH_USER_MODEL, verbose_name='Recipient user')),
                ('sender', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='sent_messages', to=settings.AUTH_USER_MODEL, verbose_name='Sender')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='MessageReceipt',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('read_at', models.DateTimeField(blank=True, null=True)),
                ('message', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='receipts', to='api.internalmessage')),
                ('recipient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='message_receipts', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-id'],
            },
        ),
        migrations.AddConstraint(
            model_name='messagereceipt',
            constraint=models.UniqueConstraint(fields=('message', 'recipient'), name='unique_message_recipient'),
        ),
    ]
