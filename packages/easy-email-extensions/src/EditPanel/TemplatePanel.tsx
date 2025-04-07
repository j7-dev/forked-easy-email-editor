import React from 'react';
import { Card, Grid } from '@arco-design/web-react';
import styles from './TemplatePanel.module.scss';
import { useEmailEditor } from '@/components/Provider/EmailEditorProvider';
import templates from './config/templates.json';
import { getTemplate } from './config/getTemplate';
import { IEmailTemplate } from '@/typings';
import { IBlockData } from '@core/typings';

interface Template {
  path: string;
  article_id: number;
  title: string;
  summary: string;
  picture: string;
  category_id: number;
  origin_source: string;
  readcount: number;
  user_id: number;
  secret: number;
  level: number;
  created_at: number;
  updated_at: number;
  deleted_at: number;
  tags: Array<{
    tag_id: number;
    name: string;
    picture: string;
    desc: string;
    created_at: number;
    user_id: number;
    updated_at: number;
    deleted_at: number;
  }>;
}

const Row = Grid.Row;
const Col = Grid.Col;

interface content {
  article_id: number;
  content: string;
}

interface IArticle {
  article_id: number;
  user_id: number;
  category_id: number;
  tags: { tag_id: number; }[]; // 由于懒得写接口，这个接口是拿之前的，其实不需要数组
  picture: string;
  title: string;
  summary: string;
  secret: number;
  readcount: number;
  updated_at: number;
  created_at: number;
  level: number;
  content: content;
}

function getAdaptor(data: IArticle): IEmailTemplate {
  const content = JSON.parse(data.content.content) as IBlockData;
  return {
    ...data,
    content,
    subject: data.title,
    subTitle: data.summary,
  };
}

export function TemplatePanel() {
  const { handleTemplateChange } = useEmailEditor();

  const handleTemplateSelect = async (template: Template) => {
    try {
      console.log('template article_id', template.article_id);
      const _templateData = await getTemplate(template.article_id);

      const templateContent = getAdaptor(_templateData);

      const templateData: IEmailTemplate = {
        subject: template.title,
        subTitle: template.summary,
        content: templateContent.content
      };

      console.log('Final template data:', templateData);
      handleTemplateChange(templateData);
    } catch (error) {
      console.error('Failed to load template:', error);
    }
  };

  return (
    <div className={styles.templatePanel}>
      <TemplateWarning />
      <Row gutter={[16, 16]}>
        {(templates as Template[]).map((template) => (
          <Col key={template.article_id} span={12}>
            <Card
              hoverable
              className={styles.templateCard}
              onClick={() => handleTemplateSelect(template)}
            >
              <div className={styles.templateThumbnail}>
                <img src={template.picture} alt={template.title} />
              </div>
              <div className={styles.templateInfo}>
                <h3>{template.title}</h3>
                <p>{template.summary}</p>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

function TemplateWarning() {
  return (
    <div className={styles.templateWarning}>
      <div className={styles.templateWarningIcon}>&#x26A0;</div>
      <div className={styles.templateWarningContent}>
        <h3>警告</h3>
        <p>注意: 選擇模板後, 會直接覆蓋當前編輯器內容</p>
      </div>
    </div>
  );
}
