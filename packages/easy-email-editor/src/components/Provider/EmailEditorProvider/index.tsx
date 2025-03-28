import { IEmailTemplate } from '@/typings';
import { Form, useForm, useFormState, useField } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import React, { useEffect, useState, createContext, useContext, useMemo } from 'react';
import { BlocksProvider } from '..//BlocksProvider';
import { HoverIdxProvider } from '../HoverIdxProvider';
import { PropsProvider, PropsProviderProps } from '../PropsProvider';
import { RecordProvider } from '../RecordProvider';
import { ScrollProvider } from '../ScrollProvider';
import { Config, FormApi, FormState } from 'final-form';
import setFieldTouched from 'final-form-set-field-touched';
import { FocusBlockLayoutProvider } from '../FocusBlockLayoutProvider';
import { PreviewEmailProvider } from '../PreviewEmailProvider';
import { LanguageProvider } from '../LanguageProvider';
import { overrideErrorLog, restoreErrorLog } from '@/utils/logger';

interface EmailEditorContextType {
  templateValue: IEmailTemplate;
  handleTemplateChange: (template: IEmailTemplate) => void;
}

const EmailEditorContext = createContext<EmailEditorContextType>({
  templateValue: {
    subject: '',
    subTitle: '',
    content: [],
  },
  handleTemplateChange: () => { },
});

export const useEmailEditor = () => {
  const context = useContext(EmailEditorContext);
  if (!context) {
    throw new Error('useEmailEditor must be used within an EmailEditorProvider');
  }
  return context;
};

export interface EmailEditorProviderProps<T extends IEmailTemplate = any>
  extends Omit<PropsProviderProps, 'children'> {
  data: T;
  children: (
    props: FormState<T>,
    helper: FormApi<IEmailTemplate, Partial<IEmailTemplate>>,
  ) => React.ReactNode;
  onSubmit?: Config<IEmailTemplate, Partial<IEmailTemplate>>['onSubmit'];
  validationSchema?: Config<IEmailTemplate, Partial<IEmailTemplate>>['validate'];
}

export const EmailEditorProvider = <T extends any>(
  props: EmailEditorProviderProps & T,
) => {
  const { data, children, onSubmit = () => { }, validationSchema } = props;

  const [templateValue, setTemplateValue] = useState<IEmailTemplate>({
    subject: data?.subject || '',
    subTitle: data?.subTitle || '',
    content: data?.content || {
      type: 'page',
      data: {
        value: {
          breakpoint: '480px',
          headAttributes: '',
          fonts: [],
          headStyles: [],
        }
      },
      attributes: {
        width: '100%',
        'background-color': '#ffffff',
      },
      children: []
    },
  });

  const templateValueMemo = useMemo(() => {
    return {
      subject: templateValue.subject,
      subTitle: templateValue.subTitle,
      content: templateValue.content,
    };
  }, [templateValue.subject, templateValue.subTitle, templateValue.content]);

  useEffect(() => {
    overrideErrorLog();
    return () => {
      restoreErrorLog();
    };
  }, []);

  const handleTemplateChange = (template: IEmailTemplate) => setTemplateValue(template);

  console.log("templateValueMemo", templateValueMemo);

  return (
    <EmailEditorContext.Provider
      value={{
        templateValue,
        handleTemplateChange,
      }}
    >
      <Form<IEmailTemplate>
        initialValues={templateValueMemo}
        onSubmit={onSubmit}
        enableReinitialize
        validate={validationSchema}
        mutators={{ ...arrayMutators, setFieldTouched: setFieldTouched as any }}
        subscription={{ submitting: true, pristine: true }}
      >
        {() => (
          <>
            <PropsProvider {...props}>
              <LanguageProvider locale={props.locale}>
                <PreviewEmailProvider>
                  <RecordProvider>
                    <BlocksProvider>
                      <HoverIdxProvider>
                        <ScrollProvider>
                          <FocusBlockLayoutProvider>
                            <FormWrapper children={children} />
                          </FocusBlockLayoutProvider>
                        </ScrollProvider>
                      </HoverIdxProvider>
                    </BlocksProvider>
                  </RecordProvider>
                </PreviewEmailProvider>
              </LanguageProvider>
            </PropsProvider>
            <RegisterFields />
          </>
        )}
      </Form>
    </EmailEditorContext.Provider>
  );
};

function FormWrapper({ children }: { children: EmailEditorProviderProps['children']; }) {
  const data = useFormState<IEmailTemplate>();
  const helper = useForm<IEmailTemplate>();
  return <>{children(data, helper)}</>;
}

// final-form bug https://github.com/final-form/final-form/issues/169

const RegisterFields = React.memo(() => {
  const { touched } = useFormState<IEmailTemplate>();
  const [touchedMap, setTouchedMap] = useState<{ [key: string]: boolean; }>({});

  useEffect(() => {
    if (touched) {
      Object.keys(touched)
        .filter(key => touched[key])
        .forEach(key => {
          setTouchedMap(obj => {
            obj[key] = true;
            return { ...obj };
          });
        });
    }
  }, [touched]);

  return (
    <>
      {Object.keys(touchedMap).map(key => {
        return (
          <RegisterField
            key={key}
            name={key}
          />
        );
      })}
    </>
  );
});

function RegisterField({ name }: { name: string; }) {
  useField(name);
  return <></>;
}
