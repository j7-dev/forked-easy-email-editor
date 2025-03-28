import React from 'react';
import { Card, Grid } from '@arco-design/web-react';
import styles from './TemplatePanel.module.scss';
import { useEditorProps } from 'easy-email-editor';
import { IEmailTemplate } from 'easy-email-editor';
import templates from './config/templates.json';

const Row = Grid.Row;
const Col = Grid.Col;

export function TemplatePanel() {
  const editorProps = useEditorProps();

  const handleTemplateSelect = async (template: { path: string; article_id: number; title: string; summary: string; picture: string; }) => {
    try {
      // 加载模板数据
      const response = await fetch(`/templates/${template.path}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const templateData: IEmailTemplate = await response.json();

      // 更新编辑器内容
      // @ts-ignore
      if (editorProps.onLoadTemplate) {
        // @ts-ignore
        editorProps.onLoadTemplate(templateData);
      } else {
        // 如果没有 onLoadTemplate，尝试直接更新 content
        // @ts-ignore
        if (editorProps.onChange) {
          // @ts-ignore
          editorProps.onChange(templateData);
        }
      }
    } catch (error) {
      console.error('Failed to load template:', error);
    }
  };

  return (
    <div className={styles.templatePanel}>
      <Row gutter={[16, 16]}>
        {templates.map((template: { path: string; article_id: number; title: string; summary: string; picture: string; category_id: number; origin_source: string; readcount: number; user_id: number; secret: number; level: number; created_at: number; updated_at: number; deleted_at: number; tags: any[]; }) => (
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