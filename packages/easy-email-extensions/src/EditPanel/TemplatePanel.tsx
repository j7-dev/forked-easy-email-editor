import React from 'react';
import { Card, Grid } from '@arco-design/web-react';
import styles from './TemplatePanel.module.scss';
import { useEditorProps } from 'easy-email-editor';
import { IEmailTemplate } from 'easy-email-editor';

const Row = Grid.Row;
const Col = Grid.Col;

interface TemplateItem {
  path: string;
  article_id: number;
  title: string;
  summary: string;
  picture: string;
  category_id: number;
}

// 使用 require.context 动态导入模板数据
const templates: TemplateItem[] = [
  {
    path: "Arturia - Newsletter.json",
    article_id: 802,
    title: "Arturia - Newsletter",
    summary: "Nice to meet you!",
    picture: "https://d3k81ch9hvuctc.cloudfront.net/company/S7EvMw/images/77ee66f2-e268-4b53-b0f3-15864fdfbfbb.png",
    category_id: 96,
  },
  {
    path: "Food.json",
    article_id: 472,
    title: "Welcome to Easy-email",
    summary: "Nice to meet you!",
    picture: "https://d3k81ch9hvuctc.cloudfront.net/company/S7EvMw/images/9e400248-84ea-453c-beea-e7120b340f3c.png",
    category_id: 90,
  },
  {
    path: "MJML Code - Newsletter.json",
    article_id: 807,
    title: "MJML Code - Newsletter",
    summary: "Nice to meet you!",
    picture: "https://d3k81ch9hvuctc.cloudfront.net/company/S7EvMw/images/de4d139c-a137-479f-99f1-80c971eb69b2.png",
    category_id: 96,
  },
];

export function TemplatePanel() {
  const editorProps = useEditorProps();

  const handleTemplateSelect = async (template: TemplateItem) => {
    try {
      // 加载模板数据
      const response = await fetch(`/src/templates/${template.path}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const templateData: IEmailTemplate = await response.json();

      // 更新编辑器内容
      // @ts-ignore
      if (editorProps.onLoadTemplate) {
        // @ts-ignore
        editorProps.onLoadTemplate(templateData);
      }
    } catch (error) {
      console.error('Failed to load template:', error);
    }
  };

  return (
    <div className={styles.templatePanel}>
      <Row gutter={[16, 16]}>
        {templates.map((template: TemplateItem) => (
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