import React from 'react'
import {Button} from 'semantic-ui-react'
import './ButtonLink.css'

const ButtonLink = ({className = '', ...props}) =>
    <Button basic
            className={['link', className].join(' ')}
            {...props}
    />;

export default ButtonLink
